import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject, IsEnum, IsArray } from 'class-validator';

export class CreateFormDto {
    @IsString()
    @IsNotEmpty()
    form_type: string;

    @IsUUID()
    @IsOptional()
    linked_photo_id?: string;

    // --------------------------------------------------------------------------
    // BUSINESS BASIC DETAILS
    // --------------------------------------------------------------------------
    @IsString()
    @IsNotEmpty()
    business_name: string;

    @IsString()
    @IsOptional()
    business_category?: string;

    @IsString()
    @IsOptional()
    business_sub_category?: string;

    // --------------------------------------------------------------------------
    // CONTACT DETAILS
    // --------------------------------------------------------------------------
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

    // --------------------------------------------------------------------------
    // LOCATION DETAILS
    // --------------------------------------------------------------------------
    @IsNotEmpty()
    latitude: number;

    @IsNotEmpty()
    longitude: number;

    @IsString()
    @IsNotEmpty()
    address_line1: string;

    @IsString()
    @IsOptional()
    address_line2?: string;

    @IsString()
    @IsOptional()
    landmark?: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    state: string;

    @IsString()
    @IsNotEmpty()
    pin_code: string;

    @IsString()
    @IsOptional()
    country?: string;

    // --------------------------------------------------------------------------
    // BUSINESS EXTRA DETAILS
    // --------------------------------------------------------------------------
    @IsString()
    @IsOptional()
    locale?: string;

    @IsOptional()
    services_offered?: string[];

    @IsObject()
    @IsOptional()
    operating_hours?: any;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsOptional()
    tags?: string[];

    @IsOptional()
    gps_accuracy_meters?: number;

    @IsOptional()
    is_gps_adjusted?: boolean;
}

export class UpdateFormStatusDto {
    @IsString()
    @IsNotEmpty()
    status: 'APPROVED' | 'REJECTED';

    @IsString()
    @IsOptional()
    rejection_reason?: string;
}
