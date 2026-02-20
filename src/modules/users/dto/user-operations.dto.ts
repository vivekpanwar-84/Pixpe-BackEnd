import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { RoleSlug } from '../../../common/constants/roles.enum';
import { KycStatus } from '../entities/user.entity';

export class UpdateKycStatusDto {
    @IsEnum(KycStatus)
    @IsNotEmpty()
    status: KycStatus;

    @IsString()
    @IsOptional()
    reason?: string;
}

export class ChangeRoleDto {
    @IsEnum(RoleSlug)
    @IsNotEmpty()
    role: RoleSlug;
}

export class UpdateStatusDto {
    @IsBoolean()
    @IsNotEmpty()
    isActive: boolean;
}

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    email?: string;

    // Add other profile fields as needed
}
