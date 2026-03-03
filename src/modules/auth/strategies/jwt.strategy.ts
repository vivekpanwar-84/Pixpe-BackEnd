import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret-key', // Fallback for dev
        });
    }

    async validate(payload: any) {
        // payload should contain { sub: userId, email, role }
        const user = await this.usersService.findOne(payload.sub);
        if (!user || !user.is_active) {
            throw new UnauthorizedException();
        }
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            permissions: payload.permissions
        };
    }
}
