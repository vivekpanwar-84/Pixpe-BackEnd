import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class UpdateSystemSettingDto {
    @IsString()
    @IsNotEmpty()
    key: string;

    @IsString()
    @IsNotEmpty()
    value: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class CreateLogDto {
    @IsString()
    @IsNotEmpty()
    action: string;

    @IsString()
    @IsNotEmpty()
    entity: string;

    @IsString()
    @IsOptional()
    details?: string;
}
