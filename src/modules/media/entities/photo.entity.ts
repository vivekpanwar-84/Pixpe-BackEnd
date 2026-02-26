import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AoiArea } from '../../locations/entities/aoi-area.entity';
import { User } from '../../users/entities/user.entity';

@Entity('photos')
export class Photo extends BaseEntity {
    @Column({ type: 'uuid' })
    aoi_id: string;

    @ManyToOne(() => AoiArea)
    @JoinColumn({ name: 'aoi_id' })
    aoi: AoiArea;

    // --- Photo Details ---
    @Column({ type: 'varchar', length: 500 })
    photo_url: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    thumbnail_url: string;

    @Column({ type: 'int', nullable: true })
    file_size_kb: number;

    @Column({ type: 'varchar', length: 50 })
    photo_type: string; // STOREFRONT, SIGNBOARD, INTERIOR, PRODUCT, CONTACT_DETAILS

    // --- Metadata ---
    @Column({ type: 'timestamptz', nullable: true })
    taken_at: Date;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude: number;

    @Column({ type: 'jsonb', nullable: true })
    device_info: string;

    // --- Assignment ---
    @Column({ type: 'uuid' })
    uploaded_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'uploaded_by_id' })
    uploaded_by: User;

    @Column({ type: 'uuid', nullable: true })
    assigned_to_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_to_id' })
    assigned_to: User;

    @Column({ type: 'timestamptz', nullable: true })
    assigned_at: Date;

    @Column({ type: 'uuid', nullable: true })
    assigned_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_by_id' })
    assigned_by: User;

    // --- Review Status ---
    @Column({ type: 'varchar', length: 20, default: 'PENDING' })
    status: string; // PENDING, ASSIGNED, IN_REVIEW, FORM_SUBMITTED, APPROVED, REJECTED

    // --- AI Processing ---
    @Column({ type: 'text', nullable: true })
    ai_text_extracted: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    ai_confidence_score: number;

    @Column({ type: 'jsonb', nullable: true })
    ai_highlights: object;

    @Column({ type: 'timestamptz', nullable: true })
    ai_processed_at: Date;

    // --- Linkage ---
    @Column({ type: 'uuid', nullable: true })
    form_id: string;

    // --- Rejection ---
    @Column({ type: 'timestamptz', nullable: true })
    rejected_at: Date;

    @Column({ type: 'uuid', nullable: true })
    rejected_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'rejected_by_id' })
    rejected_by: User;

    @Column({ type: 'text', nullable: true })
    rejection_reason: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    rejection_category: string;

    // --- Resubmission ---
    @Column({ type: 'boolean', default: false })
    is_resubmitted: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    resubmitted_at: Date;

    @Column({ type: 'uuid', nullable: true })
    parent_photo_id: string;

    @ManyToOne(() => Photo, { nullable: true })
    @JoinColumn({ name: 'parent_photo_id' })
    parent_photo: Photo;
}
