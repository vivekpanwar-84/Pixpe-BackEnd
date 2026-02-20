import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject, IsNumber } from 'class-validator';

export class CreatePhotoDto {
    @IsString()
    @IsNotEmpty()
    storage_path: string;

    @IsString()
    @IsNotEmpty()
    file_name: string;

    @IsString()
    @IsNotEmpty()
    mime_type: string;

    @IsNumber()
    @IsNotEmpty()
    size_bytes: number;

    @IsUUID()
    @IsOptional()
    poi_id?: string;

    @IsUUID()
    @IsOptional()
    aoi_id?: string;

    @IsString()
    @IsOptional()
    photo_category?: string;

    @IsObject()
    @IsOptional()
    ai_metadata?: object;

    @IsNumber()
    @IsOptional()
    latitude?: number;

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
