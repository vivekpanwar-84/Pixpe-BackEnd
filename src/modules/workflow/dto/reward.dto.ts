import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsEnum } from 'class-validator';

export class CreateRewardRequestDto {
    @IsUUID()
    @IsOptional()
    aoi_id?: string;

    @IsNumber()
    @IsNotEmpty()
    total_photos_submitted: number;

    @IsNumber()
    @IsNotEmpty()
    total_photos_approved: number;

    @IsNumber()
    @IsNotEmpty()
    total_pois_created: number;

    @IsString()
    @IsOptional()
    request_notes?: string;
}

export class UpdateRewardStatusDto {
    @IsString()
    @IsNotEmpty()
    status: 'APPROVED' | 'REJECTED' | 'PAID';

    @IsString()
    @IsOptional()
    review_notes?: string;

    // For Payment
    @IsString()
    @IsOptional()
    payment_method?: string;

    @IsString()
    @IsOptional()
    payment_reference?: string;

    @IsNumber()
    @IsOptional()
    bonus_amount?: number;
}
