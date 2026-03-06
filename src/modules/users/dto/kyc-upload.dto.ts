import { IsString } from 'class-validator';

export class KycUploadDto {
    @IsString()
    type: string;
}
