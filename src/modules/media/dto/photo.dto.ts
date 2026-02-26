import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
export class UploadPhotoDto {
    @IsUUID()
    @IsNotEmpty()
    aoi_id: string;

    @IsString()
    @IsNotEmpty()
    photo_type: string; // STOREFRONT, SIGNBOARD, INTERIOR, PRODUCT, CONTACT_DETAILS

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    latitude?: number;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    longitude?: number;
}

export class UpdatePhotoStatusDto {
    @IsString()
    @IsNotEmpty()
    status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED' | 'ARCHIVED';

    @IsString()
    @IsOptional()
    rejection_reason?: string;
}

export class AssignPhotoDto {
    @IsUUID()
    @IsNotEmpty()
    editor_id: string;
}
