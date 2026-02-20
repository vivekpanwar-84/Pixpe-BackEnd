import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
    @Column({ type: 'uuid' })
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 200 })
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'varchar', length: 50 })
    notification_type: string; // AOI_ASSIGNED, PHOTO_REJECTED, REWARD_APPROVED, KYC_STATUS, etc.

    // --- Reference ---
    @Column({ type: 'varchar', length: 50, nullable: true })
    reference_type: string;

    @Column({ type: 'uuid', nullable: true })
    reference_id: string;

    // --- Action ---
    @Column({ type: 'varchar', length: 500, nullable: true })
    action_url: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    action_label: string;

    // --- Status ---
    @Column({ type: 'boolean', default: false })
    is_read: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    read_at: Date;

    @Column({ type: 'varchar', length: 20, default: 'IN_APP' })
    sent_via: string;

    @Column({ type: 'uuid', nullable: true })
    created_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;
}
