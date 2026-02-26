import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { CreateRewardRequestDto, UpdateRewardStatusDto } from './dto/reward.dto';

@Injectable()
export class WorkflowService {
    private readonly RATE_PER_PHOTO = 10;

    constructor(
        @InjectRepository(Reward)
        private rewardRepository: Repository<Reward>,
    ) { }

    async createRewardRequest(createDto: CreateRewardRequestDto, userId: string): Promise<Reward> {
        // Calculate estimated amount
        const amount = (createDto.total_photos_approved * this.RATE_PER_PHOTO);

        const reward = this.rewardRepository.create({
            user_id: userId,
            aoi_id: createDto.aoi_id,
            total_photos_submitted: createDto.total_photos_submitted,
            total_photos_approved: createDto.total_photos_approved,
            reward_per_photo: this.RATE_PER_PHOTO,
            reward_amount: amount,
            request_notes: createDto.request_notes,
            status: 'PENDING',
        });

        return this.rewardRepository.save(reward);
    }

    async findMyRewards(userId: string): Promise<Reward[]> {
        return this.rewardRepository.find({
            where: { user_id: userId },
            order: { requested_at: 'DESC' }
        });
    }

    async findAllRewards(status?: string): Promise<Reward[]> {
        const where = status ? { status } : {};
        return this.rewardRepository.find({
            where,
            relations: ['user', 'aoi'],
            order: { requested_at: 'DESC' }
        });
    }

    async updateRewardStatus(id: string, updateDto: UpdateRewardStatusDto, userId: string): Promise<Reward> {
        const reward = await this.rewardRepository.findOne({ where: { id } });
        if (!reward) throw new NotFoundException('Reward request not found');

        if (updateDto.status === 'APPROVED') {
            reward.status = 'APPROVED';
            reward.reviewed_by_id = userId;
            reward.reviewed_at = new Date();
            reward.review_notes = updateDto.review_notes || '';
            if (updateDto.bonus_amount) {
                reward.bonus_amount = updateDto.bonus_amount;
                // Update total amount? entity logic handles or simple sum here
                reward.reward_amount = Number(reward.reward_amount) + Number(updateDto.bonus_amount);
            }
        } else if (updateDto.status === 'REJECTED') {
            reward.status = 'REJECTED';
            reward.reviewed_by_id = userId;
            reward.reviewed_at = new Date();
            reward.review_notes = updateDto.review_notes || '';
        } else if (updateDto.status === 'PAID') {
            if (reward.status !== 'APPROVED') {
                throw new BadRequestException('Request must be APPROVED before PAYMENT');
            }
            reward.status = 'PAID';
            reward.paid_by_id = userId;
            reward.paid_at = new Date();
            reward.payment_method = updateDto.payment_method || '';
            reward.payment_reference = updateDto.payment_reference || '';
        }

        return this.rewardRepository.save(reward);
    }

    async getStats(): Promise<any> {
        // Admin dashboard stats - placeholder
        const totalRewards = await this.rewardRepository.createQueryBuilder('reward')
            .select('SUM(reward.reward_amount)', 'sum')
            .where('reward.status = :status', { status: 'PAID' })
            .getRawOne();

        return {
            total_paid: totalRewards?.sum || 0,
            pending_requests: await this.rewardRepository.count({ where: { status: 'PENDING' } }),
        };
    }
}
