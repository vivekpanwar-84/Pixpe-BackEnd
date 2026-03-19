import { Controller, Get, Post, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { NotificationsService } from './services/notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
// @UseGuards(JwtAuthGuard)
export class NotificationsController {
    private readonly logger = new Logger(NotificationsController.name);

    constructor(private readonly notificationsService: NotificationsService) {
        this.logger.log('NotificationsController initialized');
    }

    @Get('my')
    async getMyNotifications(@Request() req: any) {
        console.log(`[NotificationsController] Fetching notifications for user: ${req.user.id}`);
        const notifications = await this.notificationsService.getMyNotifications(req.user.id);
        console.log(`[NotificationsController] Found ${notifications.length} notifications`);
        return notifications;
    }

    @Post('all/read')
    async markAllAsRead(@Request() req: any) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }

    @Post('all/clear')
    async clearAllNotifications(@Request() req: any) {
        return this.notificationsService.clearAllNotifications(req.user.id);
    }

    @Post(':id/read')
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }
}
