import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray, IsBoolean } from 'class-validator';

export class CreatePoiDto {
    @IsString()
    @IsNotEmpty()
    aoi_id: string;

    // --- Business Identity ---
    @IsString()
    @IsNotEmpty()
    business_name: string;

    @IsString()
    @IsOptional()
    business_category?: string;

    @IsString()
    @IsOptional()
    business_sub_category?: string;

    // --- Contact ---
    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    alternate_phone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    website?: string;

    @IsString()
    @IsOptional()
    contact_person_name?: string;

    @IsString()
    @IsOptional()
    contact_person_designation?: string;

    // --- Location (Required) ---
    @IsNumber()
    @IsNotEmpty()
    latitude: number;

    @IsNumber()
    @IsNotEmpty()
    longitude: number;

    @IsString()
    @IsOptional()
    address_line1?: string;

    @IsString()
    @IsOptional()
    address_line2?: string;

    @IsString()
    @IsOptional()
    landmark?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    pin_code?: string;

    // --- Details ---
    @IsString()
    @IsOptional()
    locale?: string;

    @IsArray()
    @IsOptional()
    services_offered?: string[];

    @IsOptional()
    operating_hours?: any;

    // --- GPS ---
    @IsNumber()
    @IsOptional()
    gps_accuracy_meters?: number;

    @IsArray()
    @IsOptional()
    tags?: string[];

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdatePoiDto {
    @IsString()
    @IsOptional()
    business_name?: string;

    @IsString()
    @IsOptional()
    business_category?: string;

    @IsString()
    @IsOptional()
    business_sub_category?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    alternate_phone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    website?: string;

    @IsString()
    @IsOptional()
    contact_person_name?: string;

    @IsString()
    @IsOptional()
    contact_person_designation?: string;

    @IsNumber()
    @IsOptional()
    latitude?: number;

    @IsNumber()
    @IsOptional()
    longitude?: number;

    @IsString()
    @IsOptional()
    address_line1?: string;

    @IsString()
    @IsOptional()
    address_line2?: string;

    @IsString()
    @IsOptional()
    landmark?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    pin_code?: string;

    @IsString()
    @IsOptional()
    locale?: string;

    @IsArray()
    @IsOptional()
    services_offered?: string[];

    @IsOptional()
    operating_hours?: any;

    @IsNumber()
    @IsOptional()
    gps_accuracy_meters?: number;

    @IsBoolean()
    @IsOptional()
    is_gps_adjusted?: boolean;

    @IsNumber()
    @IsOptional()
    original_latitude?: number;

    @IsNumber()
    @IsOptional()
    original_longitude?: number;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsArray()
    @IsOptional()
    tags?: string[];
}

export class VerifyPoiDto {
    @IsEnum(['VERIFIED', 'REJECTED'])
    @IsNotEmpty()
    status: 'VERIFIED' | 'REJECTED';

    @IsString()
    @IsOptional()
    rejection_reason?: string;
}

export class AssignPoiDto {
    @IsString()
    @IsNotEmpty()
    editor_id: string;
}
