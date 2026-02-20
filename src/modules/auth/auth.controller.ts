import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) { }

    // 1. Login with Email + Password
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.loginWithPassword(loginDto.email, loginDto.password);
    }

    // 2. Request Email OTP
    @Post('otp/request')
    @HttpCode(HttpStatus.OK)
    async requestOtp(@Body() body: { email: string }) {
        return this.authService.requestEmailOtp(body.email);
    }

    // 3. Verify Email OTP
    @Post('otp/verify')
    @HttpCode(HttpStatus.OK)
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return this.authService.verifyEmailOtp(verifyOtpDto.email, verifyOtpDto.otp);
    }

    // 4. Create Initial Admin (Dev Only / Seeder alternative)
    @Post('admin/signup')
    async createInitialAdmin(@Body() createUserDto: CreateUserDto) {
        return this.usersService.createInitialAdmin(createUserDto);
    }
}
