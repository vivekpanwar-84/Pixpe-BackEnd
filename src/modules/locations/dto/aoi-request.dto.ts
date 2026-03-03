import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { AoiRequestStatus } from '../entities/aoi-request.entity';

export class CreateAoiRequestDto {
    @IsUUID()
    aoi_id: string;

    @IsString()
    @IsOptional()
    request_notes?: string;
}

export class UpdateAoiRequestStatusDto {
    @IsEnum(AoiRequestStatus)
    status: AoiRequestStatus;

    @IsString()
    @IsOptional()
    manager_notes?: string;
}
