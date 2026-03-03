import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AoiRequest, AoiRequestStatus } from './entities/aoi-request.entity';
import { AoiArea } from './entities/aoi-area.entity';
import { CreateAoiRequestDto, UpdateAoiRequestStatusDto } from './dto/aoi-request.dto';
import { LocationsService } from './locations.service';

@Injectable()
export class AoiRequestsService {
    constructor(
        @InjectRepository(AoiRequest)
        private aoiRequestRepository: Repository<AoiRequest>,
        @InjectRepository(AoiArea)
        private aoiRepository: Repository<AoiArea>,
        private locationsService: LocationsService,
    ) { }

    async createRequest(createDto: CreateAoiRequestDto, userId: string): Promise<AoiRequest> {
        const aoi = await this.aoiRepository.findOne({ where: { id: createDto.aoi_id } });
        if (!aoi) throw new NotFoundException('AOI not found');

        // Check if already assigned
        if (aoi.assigned_to_surveyor_id) {
            throw new BadRequestException('AOI is already assigned to a surveyor');
        }

        // Check for existing pending request from this user
        const existing = await this.aoiRequestRepository.findOne({
            where: {
                aoi_id: createDto.aoi_id,
                surveyor_id: userId,
                status: AoiRequestStatus.PENDING
            }
        });

        if (existing) {
            throw new ConflictException('You already have a pending request for this AOI');
        }

        const request = this.aoiRequestRepository.create({
            aoi_id: createDto.aoi_id,
            surveyor_id: userId,
            request_notes: createDto.request_notes,
            status: AoiRequestStatus.PENDING
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
            // Assign AOI to surveyor
            await this.locationsService.assignAoi(request.aoi_id, { surveyor_id: request.surveyor_id }, managerId);

            // Reject all other pending requests for this AOI
            await this.aoiRequestRepository.createQueryBuilder()
                .update(AoiRequest)
                .set({
                    status: AoiRequestStatus.REJECTED,
                    manager_notes: 'AOI assigned to another surveyor',
                    reviewed_by_id: managerId,
                    reviewed_at: new Date()
                })
                .where('aoi_id = :aoiId AND id != :requestId AND status = :status', {
                    aoiId: request.aoi_id,
                    requestId: request.id,
                    status: AoiRequestStatus.PENDING
                })
                .execute();
        }

        return this.aoiRequestRepository.save(request);
    }
}
