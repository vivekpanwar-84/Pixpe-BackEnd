import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { RoleSlug } from '../../../common/constants/roles.enum';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsEnum(RoleSlug)
    @IsNotEmpty()
    role: RoleSlug;
}
