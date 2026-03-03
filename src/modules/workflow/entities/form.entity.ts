import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('form')
export class Form {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // --------------------------------------------------------------------------
    // BUSINESS BASIC DETAILS
    // --------------------------------------------------------------------------
    @Column({ type: 'text' })
    business_name: string;

    @Column({ type: 'text', nullable: true })
    business_category: string;

    @Column({ type: 'text', nullable: true })
    business_sub_category: string;

    // --------------------------------------------------------------------------
    // CONTACT DETAILS
    // --------------------------------------------------------------------------
    @Column({ type: 'varchar', length: 50, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    alternate_phone: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    email: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    website: string;

    @Column({ type: 'text', nullable: true })
    contact_person_name: string;

    @Column({ type: 'text', nullable: true })
    contact_person_designation: string;

    // --------------------------------------------------------------------------
    // LOCATION DETAILS
    // --------------------------------------------------------------------------
    @Column({ type: 'decimal', precision: 10, scale: 8 })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    longitude: number;

    @Column({ type: 'text' })
    address_line1: string;

    @Column({ type: 'text', nullable: true })
    address_line2: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    landmark: string;

    @Column({ type: 'varchar', length: 100 })
    city: string;

    @Column({ type: 'varchar', length: 100 })
    state: string;

    @Column({ type: 'varchar', length: 10 })
    pin_code: string;

    @Column({ type: 'varchar', length: 50, default: 'India' })
    country: string;

    // --------------------------------------------------------------------------
    // BUSINESS EXTRA DETAILS
    // --------------------------------------------------------------------------
    @Column({ type: 'varchar', length: 50, nullable: true })
    locale: string;

    @Column({ type: 'text', array: true, nullable: true })
    services_offered: string[];

    @Column({ type: 'jsonb', nullable: true })
    operating_hours: any;

    // --------------------------------------------------------------------------
    // STATUS & VERIFICATION
    // --------------------------------------------------------------------------
    @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
    status: string;

    @Column({ type: 'varchar', length: 20, default: 'PENDING' })
    verification_status: string;

    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    gps_accuracy_meters: number;

    @Column({ type: 'boolean', default: false })
    is_gps_adjusted: boolean;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'text', array: true, nullable: true })
    tags: string[];

    // --------------------------------------------------------------------------
    // AUDIT FIELDS
    // --------------------------------------------------------------------------
    @Column({ type: 'uuid', nullable: true })
    created_by: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
