import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './entities/photo.entity';
import { PoiForm } from '../workflow/entities/poi-form.entity';
import { UploadPhotoDto, UpdatePhotoStatusDto } from './dto/photo.dto';
import { CreateFormDto, UpdateFormStatusDto } from './dto/form.dto';
import { SupabaseService } from './supabase.service';

@Injectable()
export class MediaService {
    constructor(
        @InjectRepository(Photo)
        private photoRepository: Repository<Photo>,
        @InjectRepository(PoiForm)
        private formRepository: Repository<PoiForm>,
        private supabaseService: SupabaseService,
    ) { }

    // --- Photo Operations ---

    /**
     * Upload photo to Supabase, rename it, and save metadata to DB.
     * File name format: PIXPE_{YYYYMMDD}_{POI_ID_SHORT}_{SEQ_3DIGIT}.{ext}
     * Example: PIXPE_20260221_8cce6c87_001.jpg
     */
    async uploadPhoto(
        file: Express.Multer.File,
        dto: UploadPhotoDto,
        userId: string,
    ): Promise<Photo> {
        // 1. Build sequential number based on current photo count for this POI
        const existingCount = await this.photoRepository.count({
            where: { poi_id: dto.poi_id },
        });
        const seq = String(existingCount + 1).padStart(3, '0'); // 001, 002, 003...

        // 2. Build renamed file name
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // 20260221
        const poiShort = dto.poi_id.replace(/-/g, '').slice(0, 8);       // first 8 chars
        const ext = file.mimetype.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        const fileName = `PIXPE_${dateStr}_${poiShort}_${seq}.${ext}`;

        // 3. Upload to Supabase
        const photoUrl = await this.supabaseService.uploadFile(
            file.buffer,
            file.mimetype,
            fileName,
        );

        // 4. Save metadata to DB
        const fileSizeKb = Math.round(file.size / 1024);

        const photo = this.photoRepository.create({
            poi_id: dto.poi_id,
            aoi_id: dto.aoi_id,
            photo_url: photoUrl,
            file_size_kb: fileSizeKb,
            photo_type: dto.photo_type,
            latitude: dto.latitude,
            longitude: dto.longitude,
            uploaded_by_id: userId,
            status: 'PENDING',
        });

        return this.photoRepository.save(photo);
    }

    async findMyPhotos(userId: string): Promise<Photo[]> {
        return this.photoRepository.find({ where: { uploaded_by_id: userId } });
    }

    async findAssignedPhotos(userId: string): Promise<Photo[]> {
        return this.photoRepository.find({
            where: { assigned_to_id: userId },
            relations: ['poi', 'uploaded_by'],
        });
    }

    async findOneAssignedPhoto(id: string, userId: string): Promise<Photo> {
        const photo = await this.photoRepository.findOne({
            where: { id, assigned_to_id: userId },
            relations: ['poi', 'uploaded_by', 'aoi'],
        });
        if (!photo) throw new NotFoundException('Assigned photo not found');
        return photo;
    }

    async findAllPhotos(status?: string): Promise<Photo[]> {
        const where = status ? { status } : {};
        return this.photoRepository.find({ where, relations: ['uploaded_by', 'poi'] });
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

    async deletePhoto(id: string, userId: string): Promise<void> {
        const photo = await this.photoRepository.findOne({ where: { id } });
        if (!photo) throw new NotFoundException('Photo not found');

        // Optional: Check if the user is the one who uploaded it or an admin
        // For now, allowing any authenticated surveyor to delete if assigned? 
        // Let's keep it simple: only the uploader or if assigned.
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
        if (createFormDto.linked_photo_id) {
            const photo = await this.photoRepository.findOne({ where: { id: createFormDto.linked_photo_id } });
            if (photo) {
                aoiId = photo.aoi_id;
            }
        }

        const form = this.formRepository.create({
            poi_id: createFormDto.poi_id,
            form_data: createFormDto.form_data,
            photo_id: createFormDto.linked_photo_id,
            aoi_id: aoiId ?? undefined,
            submitted_by_id: userId,
            review_status: 'PENDING',
        } as any);

        return this.formRepository.save(form as unknown as PoiForm);
    }

    async findAllForms(status?: string): Promise<PoiForm[]> {
        const where = status ? { review_status: status } : {};
        return this.formRepository.find({ where, relations: ['submitted_by'] });
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
