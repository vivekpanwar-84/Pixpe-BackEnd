import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationsGateway } from '../notifications.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        private notificationsGateway: NotificationsGateway,
    ) { }

    async createNotification(data: {
        user_id: string;
        title: string;
        message: string;
        notification_type: string;
        reference_type?: string;
        reference_id?: string;
        created_by_id?: string;
        action_url?: string;
        action_label?: string;
    }) {
        console.log(`[NotificationsService] Creating notification for user: ${data.user_id}, type: ${data.notification_type}`);
        const notification = this.notificationRepository.create({
            ...data,
            is_read: false,
        });

        const savedNotification = await this.notificationRepository.save(notification);
        console.log(`[NotificationsService] Notification saved with ID: ${savedNotification.id} for user: ${data.user_id}`);
        console.log(`[NotificationsService] Data: ${JSON.stringify({ title: data.title, type: data.notification_type })}`);

        // Send real-time notification
        console.log(`[NotificationsService] Handing off to gateway for user: ${data.user_id}`);
        this.notificationsGateway.sendNotificationToUser(data.user_id, savedNotification);

        return savedNotification;
    }

    async getMyNotifications(userId: string) {
        return this.notificationRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
        });
    }

    async markAsRead(notificationId: string) {
        return this.notificationRepository.update(notificationId, {
            is_read: true,
            read_at: new Date(),
        });
    }

    async markAllAsRead(userId: string) {
        console.log(`[NotificationsService] Marking all notifications as read for user: ${userId}`);
        return this.notificationRepository.update(
            { user_id: userId, is_read: false },
            {
                is_read: true,
                read_at: new Date(),
            }
        );
    }

    async clearAllNotifications(userId: string) {
        console.log(`[NotificationsService] Clearing all notifications for user: ${userId}`);
        return this.notificationRepository.delete({ user_id: userId });
    }
}
