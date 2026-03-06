import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AoiRequest, AoiRequestStatus, AoiRequestType } from './entities/aoi-request.entity';
import { AoiArea } from './entities/aoi-area.entity';
import { CreateAoiRequestDto, UpdateAoiRequestStatusDto } from './dto/aoi-request.dto';
import { LocationsService } from './locations.service';
import { NotificationsService } from '../system/services/notifications.service';

@Injectable()
export class AoiRequestsService {
    constructor(
        @InjectRepository(AoiRequest)
        private aoiRequestRepository: Repository<AoiRequest>,
        @InjectRepository(AoiArea)
        private aoiRepository: Repository<AoiArea>,
        private locationsService: LocationsService,
        private notificationsService: NotificationsService,
    ) { }

    async createRequest(createDto: CreateAoiRequestDto, userId: string): Promise<AoiRequest> {
        const aoi = await this.aoiRepository.findOne({ where: { id: createDto.aoi_id } });
        if (!aoi) throw new NotFoundException('AOI not found');

        const requestType = createDto.request_type || AoiRequestType.ASSIGNMENT;

        if (requestType === AoiRequestType.ASSIGNMENT) {
            // Check if already assigned
            if (aoi.assigned_to_surveyor_id) {
                throw new BadRequestException('AOI is already assigned to a surveyor');
            }
        } else if (requestType === AoiRequestType.REOPEN) {
            // Check if assigned to the requester
            if (aoi.assigned_to_surveyor_id !== userId) {
                throw new BadRequestException('You can only request to reopen AOIs assigned to you');
            }
            // Check status (only SUBMITTED/COMPLETED/CLOSED can be reopened)
            if (!['SUBMITTED', 'COMPLETED', 'CLOSED'].includes(aoi.status)) {
                throw new BadRequestException(`AOI in status ${aoi.status} cannot be reopened`);
            }
        }

        // Check for existing pending request of SAME TYPE from this user
        const existing = await this.aoiRequestRepository.findOne({
            where: {
                aoi_id: createDto.aoi_id,
                surveyor_id: userId,
                status: AoiRequestStatus.PENDING,
                request_type: requestType
            }
        });

        if (existing) {
            throw new ConflictException(`You already have a pending ${requestType.toLowerCase()} request for this AOI`);
        }

        const request = this.aoiRequestRepository.create({
            aoi_id: createDto.aoi_id,
            surveyor_id: userId,
            request_notes: createDto.request_notes,
            status: AoiRequestStatus.PENDING,
            request_type: requestType
        });

        return this.aoiRequestRepository.save(request);
    }

    async findAllPending(): Promise<AoiRequest[]> {
        return this.aoiRequestRepository.find({
            where: { status: AoiRequestStatus.PENDING },
            relations: ['aoi', 'surveyor'],
            order: { created_at: 'DESC' }
        });
    }

    async findMyRequests(userId: string): Promise<AoiRequest[]> {
        return this.aoiRequestRepository.find({
            where: { surveyor_id: userId },
            relations: ['aoi'],
            order: { created_at: 'DESC' }
        });
    }

    async respondToRequest(id: string, updateDto: UpdateAoiRequestStatusDto, managerId: string): Promise<AoiRequest> {
        const request = await this.aoiRequestRepository.findOne({
            where: { id },
            relations: ['aoi']
        });

        if (!request) throw new NotFoundException('Request not found');
        if (request.status !== AoiRequestStatus.PENDING) {
            throw new BadRequestException('Request is already processed');
        }

        request.status = updateDto.status;
        request.manager_notes = updateDto.manager_notes ?? null;
        request.reviewed_by_id = managerId;
        request.reviewed_at = new Date();

        if (updateDto.status === AoiRequestStatus.APPROVED) {
            console.log(`[AoiRequestsService] Approving request ${id} of type ${request.request_type}`);
            if (request.request_type === AoiRequestType.REOPEN) {
                // Reopen AOI: Set status back to IN_PROGRESS
                await this.locationsService.updateAoiStatus(request.aoi_id, 'IN_PROGRESS', managerId);
            } else {
                // Assignment Request: Assign AOI to surveyor
                await this.locationsService.assignAoi(request.aoi_id, { surveyor_id: request.surveyor_id }, managerId);

                // Reject all other pending ASSIGNMENT requests for this AOI
                await this.aoiRequestRepository.createQueryBuilder()
                    .update(AoiRequest)
                    .set({
                        status: AoiRequestStatus.REJECTED,
                        manager_notes: 'AOI assigned to another surveyor',
                        reviewed_by_id: managerId,
                        reviewed_at: new Date()
                    })
                    .where('aoi_id = :aoiId AND id != :requestId AND status = :status AND request_type = :type', {
                        aoiId: request.aoi_id,
                        requestId: request.id,
                        status: AoiRequestStatus.PENDING,
                        type: AoiRequestType.ASSIGNMENT
                    })
                    .execute();
            }

            // Notify Surveyor
            console.log(`[AoiRequestsService] Sending notification to surveyor ${request.surveyor_id}`);
            await this.notificationsService.createNotification({
                user_id: request.surveyor_id,
                title: request.request_type === AoiRequestType.REOPEN ? 'AOI Reopened' : 'AOI Assigned',
                message: `Your request for AOI ${request.aoi?.aoi_code || ''} has been approved.`,
                notification_type: request.request_type === AoiRequestType.REOPEN ? 'AOI_REOPENED' : 'AOI_ASSIGNED',
                reference_type: 'AOI',
                reference_id: request.aoi_id,
                created_by_id: managerId,
            });
        }

        return this.aoiRequestRepository.save(request);
    }
}
