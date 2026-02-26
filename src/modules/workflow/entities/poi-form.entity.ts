import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Photo } from '../../media/entities/photo.entity';
import { AoiArea } from '../../locations/entities/aoi-area.entity';
import { User } from '../../users/entities/user.entity';

@Entity('poi_forms')
export class PoiForm extends BaseEntity {
    @Column({ type: 'uuid' })
    photo_id: string;

    @OneToOne(() => Photo)
    @JoinColumn({ name: 'photo_id' })
    photo: Photo;

    @Column({ type: 'uuid' })
    aoi_id: string;

    @ManyToOne(() => AoiArea)
    @JoinColumn({ name: 'aoi_id' })
    aoi: AoiArea;

    // --- Form Data ---
    @Column({ type: 'jsonb' })
    form_data: any;

    // --- Submission ---
    @Column({ type: 'uuid' })
    submitted_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'submitted_by_id' })
    submitted_by: User;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    submitted_at: Date;

    // --- Review ---
    @Column({ type: 'uuid', nullable: true })
    reviewed_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reviewed_by_id' })
    reviewed_by: User;

    @Column({ type: 'timestamptz', nullable: true })
    reviewed_at: Date;

    @Column({ type: 'varchar', length: 20, default: 'PENDING' })
    review_status: string; // PENDING, APPROVED, REJECTED, NEEDS_REWORK

    @Column({ type: 'text', nullable: true })
    review_notes: string;

    // --- Master DB ---
    @Column({ type: 'boolean', default: false })
    approved_to_master: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    approved_to_master_at: Date;

    @Column({ type: 'varchar', length: 100, nullable: true })
    master_db_record_id: string;

    // --- Rework ---
    @Column({ type: 'int', default: 0 })
    rework_count: number;

    @Column({ type: 'text', array: true, nullable: true })
    rework_notes: string[];
}
