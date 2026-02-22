import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { KycDocument } from './entities/kyc-document.entity';
import { UsersService } from './users.service';
import { Role } from '../roles/entities/role.entity';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';

import { MediaModule } from '../media/media.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, KycDocument, Role]),
        forwardRef(() => AuthModule),
        MediaModule,
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [TypeOrmModule, UsersService],
})
export class UsersModule { }
