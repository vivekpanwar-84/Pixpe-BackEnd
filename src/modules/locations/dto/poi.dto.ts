import { IsString, IsNotEmpty, IsObject, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class CreatePoiDto {
    @IsString()
    @IsNotEmpty()
    poi_name: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsNumber()
    @IsNotEmpty()
    latitude: number;

    @IsNumber()
    @IsNotEmpty()
    longitude: number;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsOptional()
    aoi_id?: string; // Optional if not part of AOI workflow yet, but usually is
}

export class UpdatePoiDto {
    @IsString()
    @IsOptional()
    poi_name?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsNumber()
    @IsOptional()
    latitude?: number;

    @IsNumber()
    @IsOptional()
    longitude?: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class VerifyPoiDto {
    @IsEnum(['VERIFIED', 'REJECTED'])
    @IsNotEmpty()
    status: 'VERIFIED' | 'REJECTED';

    @IsString()
    @IsOptional()
    rejection_reason?: string;
}
