import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject, IsEnum } from 'class-validator';

export class CreateFormDto {
    @IsUUID()
    @IsNotEmpty()
    poi_id: string;

    @IsString()
    @IsNotEmpty()
    form_type: string; // e.g. BUSINESS_DETAILS, MENU_CARD

    @IsObject()
    @IsNotEmpty()
    form_data: object;

    @IsUUID()
    @IsOptional()
    linked_photo_id?: string;
}

export class UpdateFormStatusDto {
    @IsString()
    @IsNotEmpty()
    status: 'APPROVED' | 'REJECTED';

    @IsString()
    @IsOptional()
    rejection_reason?: string;
}
