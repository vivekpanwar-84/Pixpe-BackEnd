import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from './user.entity';

@Entity('kyc_documents')
export class KycDocument extends BaseEntity {
    @Column({ type: 'uuid' })
    user_id: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 100 })
    full_name: string;

    @Column({ type: 'date', nullable: true })
    date_of_birth: Date;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    state: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    pin_code: string;

    @Column({ type: 'varchar', length: 50 })
    document_type: string; // AADHAAR, PAN, DRIVING_LICENSE, VOTER_ID

    @Column({ type: 'varchar', length: 50 })
    document_number: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    document_front_url: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    document_back_url: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    selfie_url: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    bank_account_number: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    ifsc_code: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    bank_proof_url: string;

    @Column({ type: 'timestamptz', nullable: true })
    verified_at: Date;

    @Column({ type: 'uuid', nullable: true })
    verified_by: string;

    @Column({ type: 'text', nullable: true })
    rejection_reason: string;
}
