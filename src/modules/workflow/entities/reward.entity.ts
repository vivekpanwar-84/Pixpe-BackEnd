import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { AoiArea } from '../../locations/entities/aoi-area.entity';

@Entity('rewards')
export class Reward extends BaseEntity {
    @Column({ type: 'uuid' })
    user_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'uuid', nullable: true })
    aoi_id: string;

    @ManyToOne(() => AoiArea)
    @JoinColumn({ name: 'aoi_id' })
    aoi: AoiArea;

    @Column({ type: 'int', default: 0 })
    total_photos_submitted: number;

    @Column({ type: 'int', default: 0 })
    total_photos_approved: number;

    @Column({ type: 'int', default: 0 })
    total_pois_created: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    reward_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    reward_per_photo: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    reward_per_poi: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    bonus_amount: number;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    requested_at: Date;

    @Column({ type: 'text', nullable: true })
    request_notes: string;

    @Column({ type: 'varchar', length: 20, default: 'PENDING' })
    status: string; // PENDING, APPROVED, REJECTED, PAID

    @Column({ type: 'uuid', nullable: true })
    reviewed_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reviewed_by_id' })
    reviewed_by: User;

    @Column({ type: 'timestamptz', nullable: true })
    reviewed_at: Date;

    @Column({ type: 'text', nullable: true })
    review_notes: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    payment_method: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    payment_reference: string;

    @Column({ type: 'timestamptz', nullable: true })
    paid_at: Date;

    @Column({ type: 'uuid', nullable: true })
    paid_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'paid_by_id' })
    paid_by: User;
}
