import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, KycStatus } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { Role } from '../roles/entities/role.entity';
import { RoleSlug } from '../../common/constants/roles.enum';

import { SupabaseService } from '../media/supabase.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Role) // Need to inject Role repository
        private rolesRepository: Repository<Role>, // Add to constructor
        private supabaseService: SupabaseService,
    ) { }

    async submitKycDocument(userId: string, file: Express.Multer.File): Promise<User> {
        const fileName = `KYC_${userId}_${Date.now()}_${file.originalname}`;
        const url = await this.supabaseService.uploadFile(file.buffer, file.mimetype, fileName);
        return this.updateKycStatus(userId, KycStatus.SUBMITTED, undefined, undefined, url);
    }

    // --- 1. Create User (Admin Action) ---
    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.findByEmail(createUserDto.email);
        if (existingUser) throw new ConflictException('Email already exists');

        if (createUserDto.phone) {
            const existingPhone = await this.findByPhone(createUserDto.phone);
            if (existingPhone) throw new ConflictException('Phone number already exists');
        }

        const role = await this.rolesRepository.findOne({ where: { slug: createUserDto.role } });
        if (!role) throw new BadRequestException('Invalid Role');

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const { role: roleSlug, ...userData } = createUserDto;

        const newUser = this.usersRepository.create({
            ...userData,
            password: hashedPassword,
            role_id: role.id,
            is_active: true,
        });

        return this.usersRepository.save(newUser);
    }

    // --- 2. Create User (Any Role — Public Signup) ---
    async createInitialAdmin(createUserDto: CreateUserDto): Promise<User> {
        return this.createUser(createUserDto);
    }

    // --- Finders ---
    async findAll(roleSlug?: string): Promise<User[]> {
        const query = this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .where('user.is_deleted = :isDeleted', { isDeleted: false });

        if (roleSlug) {
            query.andWhere('role.slug = :roleSlug', { roleSlug });
        }

        return query.getMany();
    }

    async findPendingKyc(): Promise<User[]> {
        return this.usersRepository.find({
            where: { kyc_status: KycStatus.SUBMITTED, is_deleted: false },
            relations: ['role'],
        });
    }

    async findOne(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id, is_deleted: false },
            relations: ['role']
        });
        if (!user) {
            throw new NotFoundException(`User #${id} not found`);
        }
        return user;
    }

    async findByPhone(phone: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { phone, is_deleted: false },
            relations: ['role']
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email, is_deleted: false },
            relations: ['role']
        });
    }

    // --- Updates ---
    async update(id: string, updateUserDto: Partial<User>): Promise<User> {
        const user = await this.findOne(id);
        Object.assign(user, updateUserDto);
        return this.usersRepository.save(user);
    }

    async updateRole(id: string, roleSlug: string): Promise<User> {
        const user = await this.findOne(id);
        const role = await this.rolesRepository.findOne({ where: { slug: roleSlug } });
        if (!role) throw new BadRequestException('Invalid Role');

        user.role = role;
        return this.usersRepository.save(user);
    }

    async updateStatus(id: string, isActive: boolean): Promise<User> {
        const user = await this.findOne(id);
        user.is_active = isActive;
        if (!isActive) {
            user.current_refresh_token_hash = ''; // Force logout
        }
        return this.usersRepository.save(user);
    }

    async updateKycStatus(id: string, status: KycStatus, reason?: string, approvedBy?: string, kycDocumentUrl?: string): Promise<User> {
        const user = await this.findOne(id);
        user.kyc_status = status;

        if (kycDocumentUrl) {
            user.kyc_document_url = kycDocumentUrl;
            user.kyc_submitted_at = new Date();
        }

        if (status === KycStatus.APPROVED) {
            user.kyc_approved_at = new Date();
            user.kyc_approved_by = approvedBy || null as any;
            user.is_kyc_verified = true;
            user.kyc_rejected_reason = ''; // Clear rejection reason
        } else if (status === KycStatus.REJECTED) {
            user.kyc_rejected_reason = reason || '';
            user.is_kyc_verified = false;
            user.kyc_approved_at = null as any; // TypeORM nullable handling
            user.kyc_approved_by = null as any;
            user.kyc_document_url = ''; // Clear document on rejection
        }

        return this.usersRepository.save(user);
    }

    async remove(id: string): Promise<void> {
        const user = await this.findOne(id);
        user.is_deleted = true;
        user.deleted_at = new Date();
        await this.usersRepository.save(user);
    }
}
