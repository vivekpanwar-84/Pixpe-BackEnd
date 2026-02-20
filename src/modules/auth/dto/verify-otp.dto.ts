import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyOtpDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @IsString()
    otp: string;
}
