import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { AoiArea } from './aoi-area.entity';

export enum AoiRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

@Entity('aoi_requests')
export class AoiRequest extends BaseEntity {
    @Column({ type: 'uuid' })
    aoi_id: string;

    @ManyToOne(() => AoiArea)
    @JoinColumn({ name: 'aoi_id' })
    aoi: AoiArea;

    @Column({ type: 'uuid' })
    surveyor_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'surveyor_id' })
    surveyor: User;

    @Column({
        type: 'enum',
        enum: AoiRequestStatus,
        default: AoiRequestStatus.PENDING
    })
    status: AoiRequestStatus;

    @Column({ type: 'text', nullable: true })
    request_notes: string;

    @Column({ type: 'text', nullable: true })
    manager_notes: string | null;

    @Column({ type: 'uuid', nullable: true })
    reviewed_by_id: string | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reviewed_by_id' })
    reviewed_by: User;

    @Column({ type: 'timestamptz', nullable: true })
    reviewed_at: Date;
}
