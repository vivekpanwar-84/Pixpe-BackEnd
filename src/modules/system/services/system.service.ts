import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { UpdateSystemSettingDto, CreateLogDto } from '../dto/system.dto';

@Injectable()
export class SystemService {
    constructor(
        @InjectRepository(ActivityLog)
        private logsRepository: Repository<ActivityLog>,
        @InjectRepository(SystemSetting)
        private settingsRepository: Repository<SystemSetting>,
    ) { }

    // --- Logs ---
    async getLogs(limit: number = 50): Promise<ActivityLog[]> {
        return this.logsRepository.find({
            take: limit,
            order: { created_at: 'DESC' },
            relations: ['user'],
        });
    }

    async logActivity(userId: string, action: string, entity: string, details?: string): Promise<ActivityLog> {
        const log = this.logsRepository.create({
            user_id: userId,
            action,
            entity_type: entity,
            details,
        });
        return this.logsRepository.save(log);
    }

    // --- Settings ---
    async getSettings(): Promise<SystemSetting[]> {
        return this.settingsRepository.find();
    }

    async getSetting(key: string): Promise<string | null> {
        const setting = await this.settingsRepository.findOne({ where: { setting_key: key } });
        return setting ? setting.setting_value : null;
    }

    async updateSetting(userId: string, updateDto: UpdateSystemSettingDto): Promise<SystemSetting> {
        let setting = await this.settingsRepository.findOne({ where: { setting_key: updateDto.key } });

        if (setting) {
            setting.setting_value = updateDto.value;
            setting.updated_by_id = userId;
            if (updateDto.description) setting.description = updateDto.description;
        } else {
            setting = this.settingsRepository.create({
                setting_key: updateDto.key,
                setting_value: updateDto.value,
                description: updateDto.description,
                updated_by_id: userId,
                setting_type: 'GENERAL', // Default type
            });
        }

        await this.logActivity(userId, 'UPDATE_SETTING', 'SYSTEM', `Updated ${updateDto.key} to ${updateDto.value}`);
        return this.settingsRepository.save(setting);
    }
}
