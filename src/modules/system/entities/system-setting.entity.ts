import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('system_settings')
export class SystemSetting extends BaseEntity {
    @Column({ type: 'varchar', length: 100, unique: true })
    setting_key: string;

    @Column({ type: 'jsonb' })
    setting_value: any;

    @Column({ type: 'varchar', length: 50 })
    setting_type: string; // REWARD_CONFIG, GPS_CONFIG, AI_CONFIG, etc.

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'uuid' })
    updated_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'updated_by_id' })
    updated_by: User;
}
