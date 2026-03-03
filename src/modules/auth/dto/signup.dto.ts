import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { RoleSlug } from '../../../common/constants/roles.enum';

export class SignupDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsOptional()
    phone?: string;

    // @IsEnum(RoleSlug, { message: 'role must be one of: admin, manager, editor, surveyor' })
    // @IsNotEmpty()
    // role: RoleSlug;
    @IsEnum(RoleSlug, { message: 'role must be one of: admin, manager, editor, surveyor' })
    @IsOptional() // important hai ye 
    role: RoleSlug = RoleSlug.SURVEYOR;
}
