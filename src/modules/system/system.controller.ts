import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { SystemService } from './services/system.service';
import { UpdateSystemSettingDto } from './dto/system.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleSlug } from '../../common/constants/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
    constructor(private readonly systemService: SystemService) {
        console.log('[SystemController] Initialized');
    }

    @Get('ping')
    ping() {
        return { status: 'ok', message: 'System Controller is active' };
    }

    // --- Notifications ---
    @Get('notifications/my')
    @UseGuards(JwtAuthGuard)
    async getMyNotifications(@Req() req: any) {
        console.log(`[SystemController] Fetching notifications for user: ${req.user.id}`);
        return this.systemService.getMyNotifications(req.user.id);
    }

    @Post('notifications/:id/read')
    @UseGuards(JwtAuthGuard)
    async markAsRead(@Param('id') id: string) {
        return this.systemService.markAsRead(id);
    }

    // --- Admin: View Logs ---
    @Get('logs')
    @Roles(RoleSlug.ADMIN)
    getLogs(@Query('limit') limit: number) {
        return this.systemService.getLogs(limit);
    }

    // --- Admin: View Settings ---
    @Get('settings')
    @Roles(RoleSlug.ADMIN)
    getSettings() {
        return this.systemService.getSettings();
    }

    // --- Admin: Update Setting ---
    @Patch('settings')
    @Roles(RoleSlug.ADMIN)
    updateSetting(@Body() updateDto: UpdateSystemSettingDto, @Req() req: any) {
        return this.systemService.updateSetting(req.user.id, updateDto);
    }
}
