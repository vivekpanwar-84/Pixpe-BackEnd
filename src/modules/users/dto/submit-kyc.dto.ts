import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum DocumentType {
    AADHAAR = 'AADHAAR',
    PAN = 'PAN',
    DRIVING_LICENSE = 'DRIVING_LICENSE',
    VOTER_ID = 'VOTER_ID',
}

export class SubmitKycDto {
    @IsString()
    full_name: string;

    @IsDateString()
    @IsOptional()
    date_of_birth?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    pin_code?: string;

    @IsEnum(DocumentType)
    document_type: DocumentType;

    @IsString()
    document_number: string;

    @IsString()
    @IsOptional()
    document_front_url?: string;

    @IsString()
    @IsOptional()
    document_back_url?: string;

    @IsString()
    @IsOptional()
    selfie_url?: string;

    @IsString()
    @IsOptional()
    bank_account_number?: string;

    @IsString()
    @IsOptional()
    ifsc_code?: string;

    @IsString()
    @IsOptional()
    bank_proof_url?: string;
}
