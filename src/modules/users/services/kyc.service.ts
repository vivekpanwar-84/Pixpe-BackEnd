import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycDocument } from '../entities/kyc-document.entity';
import { User, KycStatus } from '../entities/user.entity';
import { SubmitKycDto } from '../dto/submit-kyc.dto';

@Injectable()
export class KycService {
    constructor(
        @InjectRepository(KycDocument)
        private kycRepo: Repository<KycDocument>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async submitKyc(userId: string, dto: SubmitKycDto) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        if (user.kyc_status === KycStatus.APPROVED) {
            throw new BadRequestException('KYC is already approved');
        }

        // Check if KYC document already exists for this user
        let kycDoc = await this.kycRepo.findOne({ where: { user_id: userId } });
        if (!kycDoc) {
            kycDoc = this.kycRepo.create({ user_id: userId });
        }

        // Update fields
        Object.assign(kycDoc, dto);

        // Handle date_of_birth specifically if provided as string
        if (dto.date_of_birth) {
            kycDoc.date_of_birth = new Date(dto.date_of_birth);
        }

        await this.kycRepo.save(kycDoc);

        // Update user status
        user.kyc_status = KycStatus.SUBMITTED;
        user.kyc_submitted_at = new Date();
        await this.userRepo.save(user);

        return { message: 'KYC submitted successfully', status: KycStatus.SUBMITTED };
    }

    async getStatus(userId: string) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            select: ['id', 'kyc_status', 'kyc_submitted_at', 'kyc_approved_at', 'kyc_rejected_reason']
        });

        if (!user) throw new NotFoundException('User not found');

        const kycDoc = await this.kycRepo.findOne({ where: { user_id: userId } });

        return {
            status: user.kyc_status,
            submitted_at: user.kyc_submitted_at,
            approved_at: user.kyc_approved_at,
            rejection_reason: user.kyc_rejected_reason,
            document: kycDoc || null
        };
    }
}
