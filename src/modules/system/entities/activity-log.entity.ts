import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('activity_logs')
export class ActivityLog extends BaseEntity {
    @Column({ type: 'uuid', nullable: true })
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 50, nullable: true })
    user_role: string;

    @Column({ type: 'varchar', length: 100 })
    action: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    entity_type: string;

    @Column({ type: 'uuid', nullable: true })
    entity_id: string;

    // --- Request Details ---
    @Column({ type: 'varchar', length: 45, nullable: true })
    ip_address: string;

    @Column({ type: 'text', nullable: true })
    user_agent: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    request_method: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    request_url: string;

    // --- Changes ---
    @Column({ type: 'jsonb', nullable: true })
    old_values: any;

    @Column({ type: 'jsonb', nullable: true })
    new_values: any;

    // --- Result ---
    @Column({ type: 'varchar', length: 20, nullable: true })
    status: string; // SUCCESS, FAILURE

    @Column({ type: 'text', nullable: true })
    details: string;

    @Column({ type: 'text', nullable: true })
    error_message: string;
}
