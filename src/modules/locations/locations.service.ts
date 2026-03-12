import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { AoiArea } from './entities/aoi-area.entity';
import { Photo } from '../media/entities/photo.entity';
import { CreateAoiDto, UpdateAoiDto, AssignAoiDto, BulkAssignAoiDto } from './dto/aoi.dto';
import { NotificationsService } from '../system/services/notifications.service';
import { Readable } from 'stream';
import csv from 'csv-parser';
import * as fs from 'fs';

@Injectable()
export class LocationsService {
    private readonly logger = new Logger(LocationsService.name);

    constructor(
        @InjectRepository(AoiArea)
        private aoiRepository: Repository<AoiArea>,
        @InjectRepository(Photo)
        private photoRepository: Repository<Photo>,
        private notificationsService: NotificationsService,
    ) { }

    // --- AOI Operations ---

    async createAoi(createAoiDto: CreateAoiDto, createdBy: string): Promise<AoiArea> {
        // Generate AOI Code
        const count = await this.aoiRepository.count();
        const aoiCode = `AOI-${new Date().getFullYear()}-${1000 + count + 1}`;

        const aoi = this.aoiRepository.create({
            ...createAoiDto,
            aoi_code: aoiCode,
            created_by_id: createdBy,
            status: 'DRAFT',
        });
        return this.aoiRepository.save(aoi);
    }

    async createBulkAoiFromCsv(file: Express.Multer.File, createdBy: string): Promise<any> {
        const results: any[] = [];
        const stream = Readable.from(file.buffer);

        return new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (data: any) => results.push(data))
                .on('end', async () => {
                    const createdAois: AoiArea[] = [];
                    const errors: any[] = [];

                    for (const [index, row] of results.entries()) {
                        try {
                            const {
                                aoi_name,
                                center_latitude,
                                center_longitude,
                                boundary_geojson, // This is a file path
                                city,
                                state,
                                pin_code,
                                priority,
                                deadline
                            } = row;

                            if (!aoi_name || !center_latitude || !center_longitude || !boundary_geojson || !city || !state || !pin_code) {
                                throw new Error(`Missing required fields in row ${index + 1}`);
                            }

                            // Read GeoJSON from file path
                            let geojsonContent: object;
                            try {
                                const rawGeojson = fs.readFileSync(boundary_geojson.trim(), 'utf8');
                                geojsonContent = JSON.parse(rawGeojson);
                            } catch (err) {
                                throw new Error(`Failed to read or parse GeoJSON file at ${boundary_geojson} in row ${index + 1}: ${err.message}`);
                            }

                            const aoiCount = await this.aoiRepository.count();
                            const aoiCode = `AOI-${new Date().getFullYear()}-${1000 + aoiCount + 1}`;

                            const aoi = this.aoiRepository.create({
                                aoi_name,
                                center_latitude: parseFloat(center_latitude),
                                center_longitude: parseFloat(center_longitude),
                                boundary_geojson: geojsonContent,
                                city,
                                state,
                                pin_code,
                                priority: priority || 'MEDIUM',
                                deadline: deadline ? new Date(deadline) : undefined,
                                aoi_code: aoiCode,
                                created_by_id: createdBy,
                                status: 'DRAFT',
                            });

                            const savedAoi = await this.aoiRepository.save(aoi);
                            createdAois.push(savedAoi);
                        } catch (err) {
                            this.logger.error(`Error processing CSV row ${index + 1}: ${err.message}`);
                            errors.push({ row: index + 1, message: err.message });
                        }
                    }

                    resolve({
                        successCount: createdAois.length,
                        errorCount: errors.length,
                        errors,
                        createdAois: createdAois.map((a: AoiArea) => a.aoi_code)
                    });
                })
                .on('error', (error: any) => {
                    reject(new BadRequestException(`Failed to parse CSV: ${error.message}`));
                });
        });
    }

    async findAllAoi(role?: string, userId?: string, hasForms?: boolean, unassignedOnly?: boolean): Promise<AoiArea[]> {
        const query = this.aoiRepository.createQueryBuilder('aoi')
            .leftJoinAndSelect('aoi.assigned_to_surveyor', 'assigned_to_surveyor')
            .leftJoinAndSelect('aoi.assigned_to_editor', 'assigned_to_editor')
            .leftJoinAndSelect('aoi.created_by', 'created_by');

        if (role === 'surveyor') {
            if (userId) query.where('aoi.assigned_to_surveyor_id = :userId', { userId });
        } else if (role === 'editor') {
            if (userId) query.where('aoi.assigned_to_editor_id = :userId', { userId });
        }

        if (unassignedOnly) {
            query.andWhere('aoi.assigned_to_surveyor_id IS NULL');
        }

        if (hasForms) {
            // Filter AOIs that have at least one photo with a filled form
            query.innerJoin(Photo, 'photo', 'photo.aoi_id = aoi.id')
                .innerJoin('photo.form', 'poi_form')
                .where('poi_form.id IS NOT NULL');

            // Re-apply role filter if it was overwritten by where
            if (role === 'editor' && userId) {
                query.andWhere('aoi.assigned_to_editor_id = :userId', { userId });
            } else if (role === 'surveyor' && userId) {
                query.andWhere('aoi.assigned_to_surveyor_id = :userId', { userId });
            }
        }

        return query.getMany();
    }

    async findOneAoi(id: string): Promise<AoiArea> {
        const aoi = await this.aoiRepository.findOne({
            where: { id },
            relations: ['assigned_to_surveyor', 'assigned_to_editor', 'created_by']
        });
        if (!aoi) throw new NotFoundException(`AOI #${id} not found`);
        return aoi;
    }

    async findOneAssignedAoi(id: string, userId: string, role: string): Promise<AoiArea> {
        const where: any = { id };
        if (role === 'surveyor') {
            where.assigned_to_surveyor_id = userId;
        } else if (role === 'editor') {
            where.assigned_to_editor_id = userId;
        }

        const aoi = await this.aoiRepository.findOne({
            where,
            relations: ['assigned_to_surveyor', 'assigned_to_editor', 'created_by']
        });
        if (!aoi) throw new NotFoundException(`Assigned AOI #${id} not found or not assigned to you`);
        return aoi;
    }

    async updateAoi(id: string, updateAoiDto: UpdateAoiDto): Promise<AoiArea> {
        const aoi = await this.findOneAoi(id);
        Object.assign(aoi, updateAoiDto);
        return this.aoiRepository.save(aoi);
    }

    async assignAoi(id: string, assignDto: AssignAoiDto, assignedBy: string): Promise<AoiArea> {
        const aoi = await this.findOneAoi(id);

        if (assignDto.surveyor_id) {
            aoi.assigned_to_surveyor_id = assignDto.surveyor_id;
            aoi.assigned_by_surveyor_id = assignedBy;
            aoi.assigned_at_surveyor = new Date();
            aoi.status = 'ASSIGNED';
        }

        if (assignDto.editor_id) {
            aoi.assigned_to_editor_id = assignDto.editor_id;
            aoi.assigned_by_editor_id = assignedBy;
            aoi.assigned_at_editor = new Date();

            // Cascade assignment to all photos in the AOI
            this.logger.log(`Cascading assignment for AOI ${id} to editor ${assignDto.editor_id}`);
            await this.photoRepository.update(
                { aoi_id: id },
                {
                    assigned_to_id: assignDto.editor_id,
                    assigned_by_id: assignedBy,
                    assigned_at: new Date(),
                    status: 'ASSIGNED'
                }
            );
        }

        const savedAoi = await this.aoiRepository.save(aoi);

        if (assignDto.surveyor_id) {
            this.logger.log(`[LocationsService] Creating notification for surveyor: ${assignDto.surveyor_id}`);
            await this.notificationsService.createNotification({
                user_id: assignDto.surveyor_id,
                title: 'New AOI Assigned',
                message: `AOI ${savedAoi.aoi_code} has been assigned to you for survey.`,
                notification_type: 'AOI_ASSIGNED',
                reference_type: 'AOI',
                reference_id: savedAoi.id,
                created_by_id: assignedBy,
            });
        }

        if (assignDto.editor_id) {
            this.logger.log(`[LocationsService] Creating notification for editor: ${assignDto.editor_id}`);
            await this.notificationsService.createNotification({
                user_id: assignDto.editor_id,
                title: 'New AOI Assigned for Review',
                message: `AOI ${savedAoi.aoi_code} has been assigned to you for review.`,
                notification_type: 'AOI_ASSIGNED',
                reference_type: 'AOI',
                reference_id: savedAoi.id,
                created_by_id: assignedBy,
            });
        }

        return savedAoi;
    }

    async bulkAssignAoi(bulkDto: BulkAssignAoiDto, assignedBy: string): Promise<void> {
        const { aoi_ids, surveyor_id, editor_id } = bulkDto;

        for (const id of aoi_ids) {
            const aoi = await this.findOneAoi(id);

            if (surveyor_id) {
                aoi.assigned_to_surveyor_id = surveyor_id;
                aoi.assigned_by_surveyor_id = assignedBy;
                aoi.assigned_at_surveyor = new Date();
                aoi.status = 'ASSIGNED';
            }

            if (editor_id) {
                aoi.assigned_to_editor_id = editor_id;
                aoi.assigned_by_editor_id = assignedBy;
                aoi.assigned_at_editor = new Date();

                // Cascade assignment to all photos in the AOI
                await this.photoRepository.update(
                    { aoi_id: id },
                    {
                        assigned_to_id: editor_id,
                        assigned_by_id: assignedBy,
                        assigned_at: new Date(),
                        status: 'ASSIGNED'
                    }
                );
            }

            const savedAoi = await this.aoiRepository.save(aoi);

            if (surveyor_id) {
                this.logger.log(`[LocationsService-Bulk] Creating notification for surveyor: ${surveyor_id}`);
                await this.notificationsService.createNotification({
                    user_id: surveyor_id,
                    title: 'New AOI Assigned (Bulk)',
                    message: `AOI ${savedAoi.aoi_code} has been assigned to you via bulk assignment for survey.`,
                    notification_type: 'AOI_ASSIGNED',
                    reference_type: 'AOI',
                    reference_id: savedAoi.id,
                    created_by_id: assignedBy,
                });
            }

            if (editor_id) {
                this.logger.log(`[LocationsService-Bulk] Creating notification for editor: ${editor_id}`);
                await this.notificationsService.createNotification({
                    user_id: editor_id,
                    title: 'New AOI Assigned (Bulk)',
                    message: `AOI ${savedAoi.aoi_code} has been assigned to you via bulk assignment for review.`,
                    notification_type: 'AOI_ASSIGNED',
                    reference_type: 'AOI',
                    reference_id: savedAoi.id,
                    created_by_id: assignedBy,
                });
            }
        }
    }

    async getAoiPhotoStats(id: string) {
        const totalPhotos = await this.photoRepository.count({
            where: { aoi_id: id }
        });

        const rejectedPhotos = await this.photoRepository.count({
            where: { aoi_id: id, status: 'REJECTED' }
        });

        const reviewedPhotos = await this.photoRepository.count({
            where: { aoi_id: id, form_id: Not(IsNull()) }
        });

        const pendingPhotos = await this.photoRepository.count({
            where: {
                aoi_id: id,
                form_id: IsNull(),
                status: Not('REJECTED')
            }
        });

        return {
            totalPhotos,
            rejectedPhotos,
            reviewedPhotos,
            pendingPhotos
        };
    }

    async updateAoiStatus(id: string, status: string, userId: string): Promise<AoiArea> {
        const aoi = await this.findOneAoi(id);
        const oldStatus = aoi.status;
        aoi.status = status;

        if (status === 'SUBMITTED') {
            aoi.submitted_at = new Date();

            // Notify Manager/Admin who assigned this or created it
            const managerId = aoi.assigned_by_surveyor_id || aoi.created_by_id;
            if (managerId) {
                this.logger.log(`[LocationsService] Notifying manager ${managerId} about AOI submission: ${aoi.aoi_code}`);
                await this.notificationsService.createNotification({
                    user_id: managerId,
                    title: 'AOI Submitted',
                    message: `Surveyor has submitted AOI ${aoi.aoi_code} for review.`,
                    notification_type: 'AOI_SUBMITTED',
                    reference_type: 'AOI',
                    reference_id: aoi.id,
                    created_by_id: userId, // The surveyor who submitted
                });
            }
        }

        if (status === 'CLOSED') {
            aoi.closed_at = new Date();
            aoi.closed_by_id = userId;
        }

        return this.aoiRepository.save(aoi);
    }
}
