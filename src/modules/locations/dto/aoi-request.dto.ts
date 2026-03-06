import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { AoiRequestStatus, AoiRequestType } from '../entities/aoi-request.entity';

export class CreateAoiRequestDto {
    @IsUUID()
    aoi_id: string;

    @IsString()
    @IsOptional()
    request_notes?: string;

    @IsEnum(AoiRequestType)
    @IsOptional()
    request_type?: AoiRequestType;
}

export class UpdateAoiRequestStatusDto {
    @IsEnum(AoiRequestStatus)
    status: AoiRequestStatus;

    @IsString()
    @IsOptional()
    manager_notes?: string;
}
