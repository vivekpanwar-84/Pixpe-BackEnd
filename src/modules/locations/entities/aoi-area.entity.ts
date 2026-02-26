import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('aoi_areas')
export class AoiArea extends BaseEntity {
    @Column({ type: 'varchar', length: 50, unique: true })
    aoi_code: string;

    @Column({ type: 'varchar', length: 200 })
    aoi_name: string;

    @Column({ type: 'jsonb' })
    boundary_geojson: object;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    center_latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    center_longitude: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    state: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    pin_code: string;

    @Column({ type: 'varchar', length: 50, default: 'India' })
    country: string;

    @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
    area_size_sqkm: number;

    // --- Surveyor Assignment ---
    @Column({ type: 'uuid', nullable: true })
    assigned_to_surveyor_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_to_surveyor_id' })
    assigned_to_surveyor: User;

    @Column({ type: 'timestamptz', nullable: true })
    assigned_at_surveyor: Date;

    @Column({ type: 'uuid', nullable: true })
    assigned_by_surveyor_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_by_surveyor_id' })
    assigned_by_surveyor: User;

    // --- Editor Assignment ---
    @Column({ type: 'uuid', nullable: true })
    assigned_to_editor_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_to_editor_id' })
    assigned_to_editor: User;

    @Column({ type: 'timestamptz', nullable: true })
    assigned_at_editor: Date;

    @Column({ type: 'uuid', nullable: true })
    assigned_by_editor_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'assigned_by_editor_id' })
    assigned_by_editor: User;

    // --- Status ---
    @Column({ type: 'varchar', length: 20, default: 'DRAFT' })
    status: string; // DRAFT, ASSIGNED, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, COMPLETED, CLOSED

    @Column({ type: 'timestamptz', nullable: true })
    submitted_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
    close_requested_at: Date;

    @Column({ type: 'text', nullable: true })
    close_request_reason: string;

    @Column({ type: 'timestamptz', nullable: true })
    closed_at: Date;

    @Column({ type: 'uuid', nullable: true })
    closed_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'closed_by_id' })
    closed_by: User;

    // --- Metadata ---
    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'varchar', length: 20, default: 'MEDIUM' })
    priority: string;

    @Column({ type: 'date', nullable: true })
    deadline: Date;

    @Column({ type: 'uuid' })
    created_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;
}
