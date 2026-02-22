import { IsString, IsUrl } from 'class-validator';

export class SubmitKycDto {
    @IsString()
    @IsUrl()
    kyc_document_url: string;
}
