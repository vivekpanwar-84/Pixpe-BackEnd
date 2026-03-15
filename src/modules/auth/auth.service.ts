import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../system/services/email.service';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private emailService: EmailService,
    ) { }

    // --- 0. Public Signup (All Roles) ---
    async signup(signupDto: SignupDto) {
        const user = await this.usersService.createUser(signupDto);
        // Re-fetch with role relation for token generation
        const fullUser = await this.usersService.findByEmail(user.email);
        return this.generateToken(fullUser);
    }

    // --- 1. Login with Password (Admin/User) ---
    async loginWithPassword(email: string, pass: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        if (!user.password) throw new UnauthorizedException('Password not set. Try OTP login.');

        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        if (!user.is_active) throw new UnauthorizedException('Account is inactive');

        return this.generateToken(user);
    }

    // --- 2. Request Email OTP (Alternative Login) ---
    async requestEmailOtp(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('User not found');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await this.usersService.update(user.id, {
            otp,
            otp_expiry: otpExpiry
        });

        await this.emailService.sendOtp(user.email, otp);

        return { message: 'OTP sent to email' };
    }

    // --- 3. Verify Email OTP ---
    async verifyEmailOtp(email: string, otp: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('User not found');

        if (!user.is_active) throw new UnauthorizedException('Account is inactive');

        if (user.otp !== otp) throw new UnauthorizedException('Invalid OTP');

        if (!user.otp_expiry || new Date() > user.otp_expiry) {
            throw new UnauthorizedException('OTP expired');
        }

        // Clear OTP
        await this.usersService.update(user.id, {
            otp: null,
            otp_expiry: null,
            is_email_verified: true,
            last_login_at: new Date()
        });

        return this.generateToken(user);
    }

    private generateToken(user: any) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role?.slug,
            permissions: user.role?.permissions
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role?.slug,
                kyc_status: user.kyc_status,
            }
        };
    }
}
