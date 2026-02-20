import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Role } from '../roles/entities/role.entity';
import { AuthController } from './auth.controller';
import { SystemModule } from '../system/system.module';

@Module({
    imports: [
        forwardRef(() => UsersModule),
        SystemModule,
        PassportModule,
        TypeOrmModule.forFeature([Role]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'super-secret-key',
                signOptions: { expiresIn: '7d' }, // Long expiry for mobile apps usually
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule { }
