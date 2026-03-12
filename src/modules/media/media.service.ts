import { Injectable, NotFoundException, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Photo } from './entities/photo.entity';
import { PoiForm } from '../workflow/entities/poi-form.entity';
import { Form } from '../workflow/entities/form.entity';
import { AoiArea } from '../locations/entities/aoi-area.entity';
import { UploadPhotoDto, UpdatePhotoStatusDto } from './dto/photo.dto';
import { CreateFormDto, UpdateFormStatusDto, CheckDuplicateDto } from './dto/form.dto';
import { SupabaseService } from './supabase.service';
import { NotificationsService } from '../system/services/notifications.service';

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);

    constructor(
        @InjectRepository(Photo)
        private photoRepository: Repository<Photo>,
        @InjectRepository(PoiForm)
        private poiFormRepository: Repository<PoiForm>,
        @InjectRepository(Form)
        private formRepository: Repository<Form>,
        @InjectRepository(AoiArea)
        private aoiRepository: Repository<AoiArea>,
        private supabaseService: SupabaseService,
        private notificationsService: NotificationsService,
        private dataSource: DataSource,
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
        const randomSuffix = Math.random().toString(36).substring(2, 6); // 4-char random string
        const fileName = `PIXPE_${dateStr}_${aoiShort}_${seq}_${randomSuffix}.${ext}`;

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
            photo_type: dto.photo_type || 'OTHER',
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
            relations: ['uploaded_by', 'form', 'form.form'],
        });
    }

    async findOneAssignedPhoto(id: string, userId: string): Promise<Photo> {
        const photo = await this.photoRepository.findOne({
            where: { id, assigned_to_id: userId },
            relations: ['uploaded_by', 'aoi', 'form', 'form.form'],
        });
        if (!photo) throw new NotFoundException('Assigned photo not found');
        return photo;
    }

    async findAllPhotos(status?: string, aoiId?: string): Promise<Photo[]> {
        const where: any = {};
        if (status) where.status = status;
        if (aoiId) where.aoi_id = aoiId;
        return this.photoRepository.find({ where, relations: ['uploaded_by', 'form', 'form.form'], order: { created_at: 'DESC' } });
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

        const savedPhoto = await this.photoRepository.save(photo);

        if (updateDto.status === 'REJECTED') {
            await this.notificationsService.createNotification({
                user_id: savedPhoto.uploaded_by_id,
                title: 'Photo Rejected',
                message: `Your photo for AOI has been rejected. Reason: ${updateDto.rejection_reason || 'No reason provided'}`,
                notification_type: 'PHOTO_REJECTED',
                reference_type: 'PHOTO',
                reference_id: savedPhoto.id,
                created_by_id: userId,
            });
        }

        return savedPhoto;
    }

    async findPhotosByAoiAndEditor(aoiId: string, editorId: string): Promise<Photo[]> {
        return this.photoRepository.find({
            where: {
                aoi_id: aoiId,
                assigned_to_id: editorId,
            },
            relations: ['uploaded_by', 'aoi', 'form', 'form.form'],
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
        if (createFormDto.linked_photo_id) {
            const photo = await this.photoRepository.findOne({ where: { id: createFormDto.linked_photo_id } });
            if (photo) {
                aoiId = photo.aoi_id;
                this.logger.log(`[CREATE-FORM] Resolving AOI ID ${aoiId} from photo ${createFormDto.linked_photo_id}`);
            }
        }

        // Check if we are updating an existing form for this photo
        const existingPoiForm = await this.poiFormRepository.findOne({
            where: { photo_id: createFormDto.linked_photo_id }
        });

        // --- PRE-SUBMISSION DUPLICATE CHECK ---
        const duplicates = await this.checkDuplicateForm({
            aoi_id: aoiId || '',
            business_name: createFormDto.business_name,
            phone: createFormDto.phone,
            latitude: createFormDto.latitude,
            longitude: createFormDto.longitude,
            exclude_form_id: existingPoiForm?.form_id
        });

        if (duplicates.length > 0) {
            const names = duplicates.map(d => d.business_name).join(', ');
            this.logger.warn(`[CREATE-FORM] Duplicate detected! Names: ${names}`);
            throw new BadRequestException(`Potential duplicate entry detected: ${names}. Please resolve the conflict before submitting.`);
        }

        return this.dataSource.transaction(async (manager) => {
            let photo = null;

            if (createFormDto.linked_photo_id) {
                photo = await manager.findOne(Photo, { where: { id: createFormDto.linked_photo_id } });
            }

            // 1. Check if a PoiForm already exists for this photo
            let poiForm = await manager.findOne(PoiForm, {
                where: { photo_id: createFormDto.linked_photo_id },
                relations: ['form']
            });

            let form: Form;

            // 2. Create or Update the structured Form data
            const formPayload = {
                business_name: createFormDto.business_name,
                business_category: createFormDto.business_category,
                business_sub_category: createFormDto.business_sub_category,
                phone: createFormDto.phone,
                alternate_phone: createFormDto.alternate_phone,
                email: createFormDto.email,
                website: createFormDto.website,
                contact_person_name: createFormDto.contact_person_name,
                contact_person_designation: createFormDto.contact_person_designation,
                latitude: createFormDto.latitude,
                longitude: createFormDto.longitude,
                address_line1: createFormDto.address_line1,
                address_line2: createFormDto.address_line2,
                landmark: createFormDto.landmark,
                city: createFormDto.city,
                state: createFormDto.state,
                pin_code: createFormDto.pin_code,
                country: createFormDto.country || 'India',
                locale: createFormDto.locale,
                services_offered: createFormDto.services_offered,
                operating_hours: createFormDto.operating_hours,
                notes: createFormDto.notes,
                tags: createFormDto.tags,
                gps_accuracy_meters: createFormDto.gps_accuracy_meters,
                is_gps_adjusted: createFormDto.is_gps_adjusted,
                created_by: userId,
            };

            if (poiForm?.form_id) {
                // Update existing Form record
                await manager.update(Form, poiForm.form_id, {
                    ...formPayload,
                    updated_at: new Date()
                } as any);
                form = await manager.findOne(Form, { where: { id: poiForm.form_id } }) as Form;
                this.logger.log(`[FORM] Updated existing structured form data ${form.id}`);
            } else {
                // Create new Form record
                form = manager.create(Form, formPayload as any);
                form = await manager.save(Form, form);
                this.logger.log(`[FORM] Created new structured form data ${form.id}`);
            }

            // 3. Create or Update the PoiForm (Workflow record)
            if (poiForm) {
                poiForm.form_id = form.id;
                poiForm.aoi_id = aoiId ?? poiForm.aoi_id;
                poiForm.submitted_by_id = userId;
                poiForm.review_status = 'PENDING';
                poiForm.submitted_at = new Date();
                this.logger.log(`[FORM] Updating workflow record ${poiForm.id} for photo ${createFormDto.linked_photo_id}`);
            } else {
                poiForm = manager.create(PoiForm, {
                    form_id: form.id,
                    photo_id: createFormDto.linked_photo_id,
                    aoi_id: aoiId ?? undefined,
                    submitted_by_id: userId,
                    review_status: 'PENDING',
                });
                this.logger.log(`[FORM] Creating new workflow record for photo ${createFormDto.linked_photo_id}`);
            }

            const savedPoiForm = await manager.save(PoiForm, poiForm);

            // 4. Update photo status and link form
            if (photo) {
                await manager.update(Photo, photo.id, {
                    form_id: savedPoiForm.id,
                    status: 'FORM_SUBMITTED'
                });
                this.logger.log(`[FORM] Linked workflow ${savedPoiForm.id} to photo ${photo.id} and set status to FORM_SUBMITTED`);
            }

            // Notify Manager/Editor if AOI is assigned
            if (aoiId) {
                const aoi = await manager.findOne(AoiArea, { where: { id: aoiId } });
                console.log(`[MediaService] Form submitted for AOI ${aoi?.aoi_code}. assigned_by: ${aoi?.assigned_by_surveyor_id}, created_by: ${aoi?.created_by_id}`);

                // Target recipient: The user who assigned this AOI to the surveyor, or the creator if not explicitly assigned
                const recipientId = aoi?.assigned_by_surveyor_id || aoi?.created_by_id;

                if (recipientId) {
                    console.log(`[MediaService] Triggering notification for recipient ${recipientId}`);
                    await this.notificationsService.createNotification({
                        user_id: recipientId,
                        title: 'New Survey Submitted',
                        message: `Surveyor ${userId} has submitted a survey for AOI ${aoi?.aoi_code || 'N/A'}.`,
                        notification_type: 'SURVEY_SUBMISSION',
                        reference_type: 'POI_FORM',
                        reference_id: savedPoiForm.id,
                        created_by_id: userId,
                    });
                }
            }

            return savedPoiForm;
        });
    }

    async findAllForms(status?: string, photoId?: string, aoiId?: string, submittedById?: string): Promise<PoiForm[]> {
        const where: any = {};
        if (status) where.review_status = status;
        if (photoId) where.photo_id = photoId;
        if (aoiId) where.aoi_id = aoiId;
        if (submittedById) where.submitted_by_id = submittedById;
        return this.poiFormRepository.find({
            where,
            relations: ['submitted_by', 'photo', 'aoi', 'form'],
            order: { created_at: 'DESC' }
        });
    }

    async updateFormStatus(id: string, updateDto: UpdateFormStatusDto, userId: string): Promise<PoiForm> {
        const poiForm = await this.poiFormRepository.findOne({ where: { id } });
        if (!poiForm) throw new NotFoundException('Form not found');

        poiForm.review_status = updateDto.status;
        poiForm.reviewed_by_id = userId;
        poiForm.reviewed_at = new Date();
        if (updateDto.status === 'REJECTED') {
            poiForm.review_notes = updateDto.rejection_reason || '';
        }

        const savedForm = await this.poiFormRepository.save(poiForm);

        // Notify Surveyor of result
        console.log(`[MediaService] Form ${id} updated to ${updateDto.status}. Notifying surveyor ${savedForm.submitted_by_id}`);
        await this.notificationsService.createNotification({
            user_id: savedForm.submitted_by_id,
            title: `Survey ${updateDto.status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
            message: `Your survey for AOI has been ${updateDto.status.toLowerCase()}. ${updateDto.status === 'REJECTED' ? 'Reason: ' + updateDto.rejection_reason : ''}`,
            notification_type: 'REVIEW_RESULT',
            reference_type: 'POI_FORM',
            reference_id: savedForm.id,
            created_by_id: userId,
        });

        return savedForm;
    }

    async checkDuplicateForm(dto: CheckDuplicateDto): Promise<Form[]> {
        const { aoi_id, business_name, phone, latitude, longitude, exclude_form_id } = dto;
        this.logger.log(`[DUPLICATE-CHECK] Params: aoi=${aoi_id}, name=${business_name}, phone=${phone}, lat=${latitude}, lng=${longitude}, exclude=${exclude_form_id}`);

        const query = this.formRepository.createQueryBuilder('form')
            .innerJoin(PoiForm, 'pf', 'pf.form_id = form.id')
            .where('pf.aoi_id = :aoi_id', { aoi_id })
            .andWhere('form.status = :status', { status: 'ACTIVE' });

        if (exclude_form_id) {
            query.andWhere('form.id != :exclude_form_id', { exclude_form_id });
        }

        this.logger.log(`[DUPLICATE-CHECK] Base query restricted to AOI: ${aoi_id} and status: ACTIVE`);

        const conditions: string[] = [];
        const params: any = {};

        // 1. Business Name Match (Fuzzy)
        if (business_name) {
            conditions.push('LOWER(form.business_name) LIKE :name');
            params.name = `%${business_name.toLowerCase()}%`;
        }

        // 2. Phone Match (Last 10 digits)
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '').slice(-10);
            if (cleanPhone.length >= 8) { // Minimum length to be meaningful
                conditions.push('form.phone LIKE :phone');
                params.phone = `%${cleanPhone}`;
            }
        }

        // 3. Proximity Check (approx 15m)
        const latNum = Number(latitude);
        const lngNum = Number(longitude);

        if (!Number.isNaN(latNum) && !Number.isNaN(lngNum) && Number.isFinite(latNum) && Number.isFinite(lngNum)) {
            this.logger.log(`[DUPLICATE-CHECK] Adding proximity check for ${latNum}, ${lngNum}`);
            const threshold = 0.00015; // Approx 15m
            conditions.push('form.latitude BETWEEN :latMin AND :latMax');
            conditions.push('form.longitude BETWEEN :lngMin AND :lngMax');
            params.latMin = latNum - threshold;
            params.latMax = latNum + threshold;
            params.lngMin = lngNum - threshold;
            params.lngMax = lngNum + threshold;
        } else {
            this.logger.warn(`[DUPLICATE-CHECK] Skipping proximity check due to invalid coordinates: lat=${latitude}, lng=${longitude}`);
        }

        if (conditions.length === 0) {
            this.logger.warn('[DUPLICATE-CHECK] No valid search criteria provided!');
            return [];
        }

        // We want to find if ANY of these criteria match (OR logic for the suspicious fields)
        // But capped at the same AOI and ACTIVE status (AND logic for scope)
        query.andWhere(`(${conditions.join(' OR ')})`, params);

        const results = await query.getMany();
        this.logger.log(`[DUPLICATE-CHECK] Found ${results.length} potential duplicates`);
        return results;
    }
}
