import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './entities/photo.entity';
import { PoiForm } from '../workflow/entities/poi-form.entity';
import { AoiArea } from '../locations/entities/aoi-area.entity';
import { UploadPhotoDto, UpdatePhotoStatusDto } from './dto/photo.dto';
import { CreateFormDto, UpdateFormStatusDto } from './dto/form.dto';
import { SupabaseService } from './supabase.service';

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);

    constructor(
        @InjectRepository(Photo)
        private photoRepository: Repository<Photo>,
        @InjectRepository(PoiForm)
        private formRepository: Repository<PoiForm>,
        @InjectRepository(AoiArea)
        private aoiRepository: Repository<AoiArea>,
        private supabaseService: SupabaseService,
    ) { }

    // --- Photo Operations ---

    /**
     * Upload photo to Supabase, rename it, and save metadata to DB.
     * File name format: PIXPE_{YYYYMMDD}_{AOI_ID_SHORT}_{SEQ_3DIGIT}.{ext}
     * Example: PIXPE_20260221_8cce6c87_001.jpg
     */
    async uploadPhoto(
        file: Express.Multer.File,
        dto: UploadPhotoDto,
        userId: string,
    ): Promise<Photo> {
        // 1. Build sequential number based on current photo count for this AOI
        const existingCount = await this.photoRepository.count({
            where: { aoi_id: dto.aoi_id },
        });
        const seq = String(existingCount + 1).padStart(3, '0'); // 001, 002, 003...

        // 2. Build renamed file name
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // 20260221
        const aoiShort = dto.aoi_id.replace(/-/g, '').slice(0, 8);       // first 8 chars
        const ext = file.mimetype.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        const fileName = `PIXPE_${dateStr}_${aoiShort}_${seq}.${ext}`;

        // 3. Upload to Supabase
        const photoUrl = await this.supabaseService.uploadFile(
            file.buffer,
            file.mimetype,
            fileName,
        );

        // 4. Check if AOI has an assigned editor for auto-assignment
        this.logger.log(`[UPLOAD] Processing photo upload for AOI ID: ${dto.aoi_id}`);
        const aoi = await this.aoiRepository.findOne({ where: { id: dto.aoi_id } });

        if (!aoi) {
            this.logger.error(`[UPLOAD] AOI NOT FOUND: ${dto.aoi_id}. Photo will be saved without AOI context or assignment.`);
        } else {
            this.logger.log(`[UPLOAD] Linked AOI Found: ${aoi.aoi_code} (status: ${aoi.status}). Editor: ${aoi.assigned_to_editor_id}, AssignedBy: ${aoi.assigned_by_editor_id}`);
        }

        // 5. Save metadata to DB
        const fileSizeKb = Math.round(file.size / 1024);

        // Prep assignment fields
        const assignedToId = aoi?.assigned_to_editor_id || null;
        const assignedById = aoi?.assigned_by_editor_id || null;
        const status = assignedToId ? 'ASSIGNED' : 'PENDING';
        const assignedAt = assignedToId ? new Date() : null;

        this.logger.log(`[UPLOAD] Final Assignment - To: ${assignedToId}, By: ${assignedById}, Status: ${status}`);

        const photo = await this.photoRepository.save({
            aoi_id: dto.aoi_id,
            photo_url: photoUrl,
            file_size_kb: fileSizeKb,
            photo_type: dto.photo_type,
            latitude: dto.latitude,
            longitude: dto.longitude,
            uploaded_by_id: userId,
            status: status,
            assigned_to_id: assignedToId,
            assigned_by_id: assignedById,
            assigned_at: assignedAt,
        } as any);

        this.logger.log(`[UPLOAD] Photo saved successfully. ID: ${photo.id}, URL: ${photo.photo_url}`);

        return photo;
    }

    async findMyPhotos(userId: string, aoiId?: string): Promise<Photo[]> {
        this.logger.log(`[MY-PHOTOS] Request for User: ${userId}, AOI: ${aoiId}`);

        const query = this.photoRepository.createQueryBuilder('photo')
            .leftJoinAndSelect('photo.form', 'form')
            .leftJoinAndSelect('photo.uploaded_by', 'uploaded_by');

        if (aoiId) {
            // Fetch all photos for this AOI, regardless of who uploaded them
            query.where('photo.aoi_id = :aoiId', { aoiId });
        } else {
            // Default: fetch only photos uploaded by this user
            query.where('photo.uploaded_by_id = :userId', { userId });
        }

        query.orderBy('photo.created_at', 'DESC');

        const photos = await query.getMany();

        // Detailed debug logging
        const statusSummary = photos.map(p => `${p.status} (by ${p.uploaded_by_id})`).join(', ');
        this.logger.log(`[MY-PHOTOS] Found ${photos.length} photos. Summary: ${statusSummary}`);
        console.log(`[DEBUG] Found ${photos.length} photos. Summary: ${statusSummary}`);

        return photos;
    }

    async findAssignedPhotos(userId: string): Promise<Photo[]> {
        return this.photoRepository.find({
            where: { assigned_to_id: userId },
            relations: ['uploaded_by'],
        });
    }

    async findOneAssignedPhoto(id: string, userId: string): Promise<Photo> {
        const photo = await this.photoRepository.findOne({
            where: { id, assigned_to_id: userId },
            relations: ['uploaded_by', 'aoi', 'form'],
        });
        if (!photo) throw new NotFoundException('Assigned photo not found');
        return photo;
    }

    async findAllPhotos(status?: string, aoiId?: string): Promise<Photo[]> {
        const where: any = {};
        if (status) where.status = status;
        if (aoiId) where.aoi_id = aoiId;
        return this.photoRepository.find({ where, relations: ['uploaded_by', 'form'], order: { created_at: 'DESC' } });
    }

    async assignPhoto(id: string, editorId: string, userId: string): Promise<Photo> {
        const photo = await this.photoRepository.findOne({ where: { id } });
        if (!photo) throw new NotFoundException('Photo not found');

        photo.assigned_to_id = editorId;
        photo.assigned_by_id = userId;
        photo.assigned_at = new Date();
        photo.status = 'ASSIGNED';
        return this.photoRepository.save(photo);
    }

    async updatePhotoStatus(id: string, updateDto: UpdatePhotoStatusDto, userId: string): Promise<Photo> {
        const photo = await this.photoRepository.findOne({ where: { id } });
        if (!photo) throw new NotFoundException('Photo not found');

        photo.status = updateDto.status;
        if (updateDto.status === 'REJECTED') {
            photo.rejection_reason = updateDto.rejection_reason || '';
            photo.rejected_at = new Date();
            photo.rejected_by_id = userId;
        } else if (updateDto.status === 'RESUBMITTED') {
            photo.is_resubmitted = true;
            photo.resubmitted_at = new Date();
        }

        return this.photoRepository.save(photo);
    }

    async findPhotosByAoiAndEditor(aoiId: string, editorId: string): Promise<Photo[]> {
        return this.photoRepository.find({
            where: {
                aoi_id: aoiId,
                assigned_to_id: editorId,
            },
            relations: ['uploaded_by', 'aoi', 'form'],
            order: { created_at: 'DESC' },
        });
    }

    async deletePhoto(id: string, userId: string): Promise<void> {
        const photo = await this.photoRepository.findOne({ where: { id } });
        if (!photo) throw new NotFoundException('Photo not found');

        if (photo.uploaded_by_id !== userId && photo.assigned_to_id !== userId) {
            // throw new ForbiddenException('Not authorized');
        }

        // 1. Delete from Supabase
        const fileName = photo.photo_url.split('/').pop();
        if (fileName) {
            await this.supabaseService.deleteFile(fileName);
        }

        // 2. Delete from DB
        await this.photoRepository.delete(id);
    }

    // --- Form Operations ---

    async createForm(createFormDto: CreateFormDto, userId: string): Promise<PoiForm> {
        let aoiId = null;
        let photo = null;

        if (createFormDto.linked_photo_id) {
            photo = await this.photoRepository.findOne({ where: { id: createFormDto.linked_photo_id } });
            if (photo) {
                aoiId = photo.aoi_id;
            }
        }

        // Check if a form already exists for this photo (Upsert logic)
        let form = await this.formRepository.findOne({ where: { photo_id: createFormDto.linked_photo_id } });

        if (form) {
            form.form_data = createFormDto.form_data;
            form.aoi_id = aoiId ?? form.aoi_id;
            form.submitted_by_id = userId;
            form.review_status = 'PENDING';
            this.logger.log(`[FORM] Updating existing form ${form.id} for photo ${createFormDto.linked_photo_id}`);
        } else {
            form = this.formRepository.create({
                form_data: createFormDto.form_data,
                photo_id: createFormDto.linked_photo_id,
                aoi_id: aoiId ?? undefined,
                submitted_by_id: userId,
                review_status: 'PENDING',
            });
            this.logger.log(`[FORM] Creating new form for photo ${createFormDto.linked_photo_id}`);
        }

        const savedForm = await this.formRepository.save(form);

        // Update photo status and link form
        if (photo) {
            await this.photoRepository.update(photo.id, {
                form_id: savedForm.id,
                status: 'APPROVED'
            });
            this.logger.log(`[FORM] Linked form ${savedForm.id} to photo ${photo.id} and set status to APPROVED`);
        }

        return savedForm;
    }
    async findAllForms(status?: string, photoId?: string, aoiId?: string): Promise<PoiForm[]> {
        const where: any = {};
        if (status) where.review_status = status;
        if (photoId) where.photo_id = photoId;
        if (aoiId) where.aoi_id = aoiId;
        return this.formRepository.find({ where, relations: ['submitted_by'], order: { created_at: 'DESC' } });
    }

    async updateFormStatus(id: string, updateDto: UpdateFormStatusDto, userId: string): Promise<PoiForm> {
        const form = await this.formRepository.findOne({ where: { id } });
        if (!form) throw new NotFoundException('Form not found');

        form.review_status = updateDto.status;
        form.reviewed_by_id = userId;
        form.reviewed_at = new Date();
        if (updateDto.status === 'REJECTED') {
            form.review_notes = updateDto.rejection_reason || '';
        }

        return this.formRepository.save(form);
    }
}
