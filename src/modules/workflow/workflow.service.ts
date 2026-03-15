import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { CreateRewardRequestDto, UpdateRewardStatusDto } from './dto/reward.dto';
import { NotificationsService } from '../system/services/notifications.service';
import { AoiArea } from '../locations/entities/aoi-area.entity';
import { Photo } from '../media/entities/photo.entity';

@Injectable()
export class WorkflowService {
    private readonly RATE_PER_PHOTO = 10;

    constructor(
        @InjectRepository(Reward)
        private rewardRepository: Repository<Reward>,
        @InjectRepository(AoiArea)
        private aoiRepository: Repository<AoiArea>,
        @InjectRepository(Photo)
        private photoRepository: Repository<Photo>,
        private notificationsService: NotificationsService,
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
        return this.rewardRepository.createQueryBuilder('reward')
            .leftJoinAndSelect('reward.aoi', 'aoi')
            .where('reward.user_id = :userId', { userId })
            .orderBy('reward.requested_at', 'DESC')
            .getMany();
    }

    async findAllRewards(status?: string, page: number = 1, limit: number = 20, search?: string): Promise<{ data: Reward[], total: number, page: number, limit: number }> {
        const query = this.rewardRepository.createQueryBuilder('reward')
            .leftJoinAndSelect('reward.aoi', 'aoi');

        if (status) {
            query.andWhere('reward.status = :status', { status });
        }

        if (search) {
            query.andWhere(
                '(LOWER(aoi.aoi_name) LIKE :search OR LOWER(aoi.aoi_code) LIKE :search OR LOWER(reward.status) LIKE :search)',
                { search: `%${search.toLowerCase()}%` }
            );
        }

        query.orderBy('reward.requested_at', 'DESC');
        query.skip((page - 1) * limit).take(limit);

        const [data, total] = await query.getManyAndCount();

        return {
            data,
            total,
            page,
            limit
        };
    }

    async getMyPixpoints(userId: string): Promise<{ total_pixpoints: string }> {
        const result = await this.rewardRepository
            .createQueryBuilder('reward')
            .select('SUM(reward.reward_amount)', 'total_reward')
            .where('reward.user_id = :userId', { userId })
            .andWhere('reward.status IN (:...statuses)', { statuses: ['APPROVED', 'PAID'] })
            .getRawOne();

        const total = Number(result.total_reward || 0);
        return {
            total_pixpoints: total.toFixed(2)
        };
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

        const savedReward = await this.rewardRepository.save(reward);

        // Notify User
        await this.notificationsService.createNotification({
            user_id: savedReward.user_id,
            title: `Reward Request ${savedReward.status}`,
            message: `Your reward request for AOI has been ${savedReward.status.toLowerCase()}. ${savedReward.review_notes ? 'Notes: ' + savedReward.review_notes : ''}`,
            notification_type: 'REWARD_STATUS_CHANGE',
            reference_type: 'REWARD',
            reference_id: savedReward.id,
            created_by_id: userId,
        });

        return savedReward;
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

    async findSubmittableAois(userId: string): Promise<any[]> {
        const aois = await this.aoiRepository.find({
            where: {
                assigned_to_surveyor_id: userId,
                status: 'SUBMITTED' // Only AOIs submitted by surveyor
            }
        });

        const results = [];
        for (const aoi of aois) {
            const totalSubmitted = await this.photoRepository.count({
                where: { aoi_id: aoi.id }
            });
            const totalApproved = await this.photoRepository.count({
                where: { aoi_id: aoi.id, status: 'APPROVED' }
            });

            // Check if a reward request already exists for this AOI and is not REJECTED
            const existingRequest = await this.rewardRepository.findOne({
                where: { aoi_id: aoi.id, user_id: userId }
            });

            if (!existingRequest || existingRequest.status === 'REJECTED') {
                results.push({
                    aoi_id: aoi.id,
                    aoi_name: aoi.aoi_name,
                    aoi_code: aoi.aoi_code,
                    total_photos_submitted: totalSubmitted,
                    total_photos_approved: totalApproved,
                });
            }
        }

        return results;
    }
}
