import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from '../../roles/entities/role.entity';

export enum KycStatus {
    PENDING = 'PENDING',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

@Entity('users')
export class User extends BaseEntity {
    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 15, unique: true, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    password?: string; // Hashed with argon2

    @Column({ type: 'varchar', length: 500, nullable: true })
    profile_photo: string;

    // --- Role ---
    @Column({ type: 'uuid' })
    role_id: string;

    @ManyToOne(() => Role, (role) => role.users)
    @JoinColumn({ name: 'role_id' })
    role: Role;

    // --- OTP Verification ---
    @Column({ type: 'varchar', length: 6, nullable: true })
    otp: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    otp_expiry: Date | null;

    // --- Verification Status ---
    @Column({ type: 'boolean', default: false })
    is_phone_verified: boolean;

    @Column({ type: 'boolean', default: false })
    is_email_verified: boolean;

    @Column({ type: 'boolean', default: false })
    is_kyc_verified: boolean;

    // --- KYC Workflow ---
    @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
    kyc_status: KycStatus;

    @Column({ type: 'timestamptz', nullable: true })
    kyc_submitted_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
    kyc_approved_at: Date;

    @Column({ type: 'uuid', nullable: true })
    kyc_approved_by: string;

    @Column({ type: 'text', nullable: true })
    kyc_rejected_reason: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    kyc_document_url: string;

    // --- Account Status ---
    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'boolean', default: false })
    is_deleted: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    deleted_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
    account_surrendered_at: Date;

    // --- Session ---
    @Column({ type: 'varchar', length: 255, nullable: true })
    current_refresh_token_hash: string;

    @Column({ type: 'timestamptz', nullable: true })
    last_login_at: Date;
}
