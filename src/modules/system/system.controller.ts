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
    constructor(private readonly systemService: SystemService) { }

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
        return this.systemService.updateSetting(req.user.userId, updateDto);
    }
}
