import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { EmailService } from './services/email.service';
import { SystemService } from './services/system.service';
import { SystemController } from './system.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification, ActivityLog, SystemSetting]),
    ],
    controllers: [SystemController],
    providers: [EmailService, SystemService],
    exports: [TypeOrmModule, EmailService, SystemService],
})
export class SystemModule { }
