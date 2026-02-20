import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AoiArea } from './entities/aoi-area.entity';
import { PoiPoint } from './entities/poi-point.entity';
import { CreateAoiDto, UpdateAoiDto } from './dto/aoi.dto';
import { CreatePoiDto, UpdatePoiDto, VerifyPoiDto } from './dto/poi.dto';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(AoiArea)
        private aoiRepository: Repository<AoiArea>,
        @InjectRepository(PoiPoint)
        private poiRepository: Repository<PoiPoint>,
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

    async findAllAoi(role?: string, userId?: string): Promise<AoiArea[]> {
        // Admin/Manager/Editor see all? Or assigned?
        // Let's implement basic filtering
        const query = this.aoiRepository.createQueryBuilder('aoi')
            .leftJoinAndSelect('aoi.assigned_to', 'assigned_to')
            .leftJoinAndSelect('aoi.created_by', 'created_by');

        if (role === 'surveyor' || role === 'editor') {
            if (userId) query.where('aoi.assigned_to_id = :userId', { userId });
        }

        return query.getMany();
    }

    async findOneAoi(id: string): Promise<AoiArea> {
        const aoi = await this.aoiRepository.findOne({
            where: { id },
            relations: ['assigned_to', 'created_by']
        });
        if (!aoi) throw new NotFoundException(`AOI #${id} not found`);
        return aoi;
    }

    async updateAoi(id: string, updateAoiDto: UpdateAoiDto): Promise<AoiArea> {
        const aoi = await this.findOneAoi(id);
        Object.assign(aoi, updateAoiDto);
        return this.aoiRepository.save(aoi);
    }

    async assignAoi(id: string, surveyorId: string, assignedBy: string): Promise<AoiArea> {
        const aoi = await this.findOneAoi(id);
        aoi.assigned_to_id = surveyorId;
        aoi.assigned_by_id = assignedBy;
        aoi.assigned_at = new Date();
        aoi.status = 'ASSIGNED';
        return this.aoiRepository.save(aoi);
    }

    async updateAoiStatus(id: string, status: string, userId: string): Promise<AoiArea> {
        const aoi = await this.findOneAoi(id);
        // Check ownership if surveyor?
        aoi.status = status;
        if (status === 'SUBMITTED') aoi.submitted_at = new Date();
        if (status === 'CLOSED') {
            aoi.closed_at = new Date();
            aoi.closed_by_id = userId;
        }
        return this.aoiRepository.save(aoi);
    }

    // --- POI Operations ---

    async createPoi(createPoiDto: CreatePoiDto, createdBy: string): Promise<PoiPoint> {
        const poi = this.poiRepository.create({
            ...createPoiDto,
            created_by_id: createdBy,
            status: 'PENDING', // Pending verification
        });
        return this.poiRepository.save(poi);
    }

    async findAllPoi(assignedToAoi?: boolean, userId?: string): Promise<PoiPoint[]> {
        // If userId provided (Editor), maybe filter by assigned regions?
        // Implementation might need complex join with AOI assignment
        // For now return all for Admin/Manager
        return this.poiRepository.find({ relations: ['created_by'] });
    }

    async updatePoi(id: string, updatePoiDto: UpdatePoiDto, userId: string): Promise<PoiPoint> {
        const poi = await this.poiRepository.findOne({ where: { id } });
        if (!poi) throw new NotFoundException('POI not found');

        // Ensure only creator can update logic if needed
        // if (poi.created_by_id !== userId) throw new UnauthorizedException();

        Object.assign(poi, updatePoiDto);
        return this.poiRepository.save(poi);
    }

    async verifyPoi(id: string, verifyDto: VerifyPoiDto, verifiedBy: string): Promise<PoiPoint> {
        const poi = await this.poiRepository.findOne({ where: { id } });
        if (!poi) throw new NotFoundException('POI not found');

        poi.status = verifyDto.status;
        if (verifyDto.status === 'REJECTED') {
            poi.rejection_reason = verifyDto.rejection_reason || '';
        } else {
            poi.verified_at = new Date();
            poi.verified_by_id = verifiedBy;
        }
        return this.poiRepository.save(poi);
    }
}
