import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AoiArea } from './aoi-area.entity';
import { User } from '../../users/entities/user.entity';

@Entity('poi_points')
export class PoiPoint extends BaseEntity {
    @Column({ type: 'uuid' })
    aoi_id: string;

    @ManyToOne(() => AoiArea)
    @JoinColumn({ name: 'aoi_id' })
    aoi: AoiArea;

    // --- Business Identity ---
    @Column({ type: 'varchar', length: 200, nullable: true })
    business_name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    business_category: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    business_sub_category: string;

    // --- Contact ---
    @Column({ type: 'varchar', length: 15, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 15, nullable: true })
    alternate_phone: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    email: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    website: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    contact_person_name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    contact_person_designation: string;

    // --- Location ---
    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude: number;

    @Column({ type: 'text', nullable: true })
    address_line1: string;

    @Column({ type: 'text', nullable: true })
    address_line2: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    landmark: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    state: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    pin_code: string;

    // --- Details ---
    @Column({ type: 'varchar', length: 50, nullable: true })
    locale: string;

    @Column({ type: 'text', array: true, nullable: true })
    services_offered: string[];

    @Column({ type: 'jsonb', nullable: true })
    operating_hours: string;

    // --- Status ---
    @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
    status: string;

    @Column({ type: 'varchar', length: 20, default: 'PENDING' })
    verification_status: string;

    @Column({ type: 'timestamptz', nullable: true })
    verified_at: Date;

    @Column({ type: 'uuid', nullable: true })
    verified_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'verified_by_id' })
    verified_by: User;

    @Column({ type: 'text', nullable: true })
    rejection_reason: string;

    // --- GPS Validation ---
    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    gps_accuracy_meters: number;

    @Column({ type: 'boolean', default: false })
    is_gps_adjusted: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    original_latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    original_longitude: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'text', array: true, nullable: true })
    tags: string[];

    @Column({ type: 'uuid' })
    created_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    // --- Assignment ---
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
}
