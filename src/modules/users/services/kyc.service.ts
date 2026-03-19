import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycDocument } from '../entities/kyc-document.entity';
import { User, KycStatus } from '../entities/user.entity';
import { SubmitKycDto } from '../dto/submit-kyc.dto';
import { SupabaseService } from '../../media/supabase.service';

@Injectable()
export class KycService {
    constructor(
        @InjectRepository(KycDocument)
        private kycRepo: Repository<KycDocument>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private supabaseService: SupabaseService,
    ) { }

    async submitKyc(userId: string, dto: SubmitKycDto) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        if (user.kyc_status === KycStatus.APPROVED) {
            throw new BadRequestException('KYC is already approved');
        }

        // --- Format Validation ---
        const { document_type, document_number, bank_account_number, ifsc_code } = dto;

        try {
            if (document_type === 'AADHAAR') {
                if (!/^\d{12}$/.test(document_number)) {
                    throw new BadRequestException('Invalid Aadhaar format. Must be 12 digits.');
                }
            } else if (document_type === 'PAN') {
                if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(document_number)) {
                    throw new BadRequestException('Invalid PAN format. Example: ABCDE1234F');
                }
            } else if (document_type === 'DRIVING_LICENSE') {
                if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11}$/.test(document_number)) {
                    throw new BadRequestException('Invalid Driving License format. Standard 15 chars.');
                }
            } else if (document_type === 'VOTER_ID') {
                if (!/^[A-Z]{3}[0-9]{7}$/.test(document_number)) {
                    throw new BadRequestException('Invalid Voter ID format. Example: ABC1234567');
                }
            }

            // --- Bank Validation ---
            if (bank_account_number) {
                if (!/^\d+$/.test(bank_account_number)) {
                    throw new BadRequestException('Bank account number must contain only digits.');
                }
                if (bank_account_number.length < 9 || bank_account_number.length > 18) {
                    throw new BadRequestException('Bank account number must be between 9 and 18 digits.');
                }
            }

            if (ifsc_code) {
                if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code)) {
                    throw new BadRequestException('Invalid IFSC code format. Example: ABCD0123456');
                }
            }

            // --- Uniqueness Checks ---
            const existingDoc = await this.kycRepo.findOne({
                where: { document_number }
            });
            if (existingDoc && existingDoc.user_id !== userId) {
                throw new BadRequestException('This document number is already registered with another account.');
            }

            if (bank_account_number) {
                const existingBank = await this.kycRepo.findOne({
                    where: { bank_account_number }
                });
                if (existingBank && existingBank.user_id !== userId) {
                    throw new BadRequestException('This bank account number is already registered.');
                }
            }
        } catch (err: any) {
            const fs = require('fs');
            try {
                fs.writeFileSync('C:\\Users\\vivek\\manual_errors_debug.json', JSON.stringify({ message: err.message, response: err.response, stack: err.stack }, null, 2));
            } catch (fsErr) {
                console.error('Failed to log manual validation error:', fsErr);
            }
            throw err;
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

    async uploadKycDocument(userId: string, file: Express.Multer.File, type: string) {
        try {
            console.log(`[KycService] Uploading ${type} for user ${userId}`);
            const user = await this.userRepo.findOne({ where: { id: userId } });
            if (!user) throw new NotFoundException('User not found');

            // Sanitize name for folder path
            const sanitizedName = (user.name || 'unknown').replace(/\s+/g, '_').toLowerCase();

            // Build custom path
            const timestamp = Date.now();
            const ext = file.mimetype.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
            const fileName = `kyc_documents/${sanitizedName}/${type.toLowerCase()}_${timestamp}.${ext}`;

            console.log(`[KycService] Targeted path: ${fileName}, Mime: ${file.mimetype}`);

            // Upload to Supabase
            const publicUrl = await this.supabaseService.uploadFile(
                file.buffer,
                file.mimetype,
                fileName
            );

            console.log(`[KycService] Upload successful: ${publicUrl}`);
            return { url: publicUrl };
        } catch (error) {
            console.error(`[KycService] Upload failed for user ${userId}:`, error);
            throw error;
        }
    }
}
