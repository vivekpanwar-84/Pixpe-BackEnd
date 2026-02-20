import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateAoiDto, UpdateAoiDto, AssignAoiDto } from './dto/aoi.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleSlug } from '../../common/constants/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('aoi')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AoiController {
    constructor(private readonly locationsService: LocationsService) { }

    // --- Verified: Admin/Manager Create AOI ---
    @Post()
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    create(@Body() createAoiDto: CreateAoiDto, @Req() req: any) {
        return this.locationsService.createAoi(createAoiDto, req.user.userId);
    }

    // --- Verified: View All AOIs (Admin/Manager) ---
    @Get()
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    findAll() {
        return this.locationsService.findAllAoi();
    }

    // --- Verified: View Assigned AOIs (Surveyor/Editor) ---
    @Get('assigned')
    @Roles(RoleSlug.SURVEYOR, RoleSlug.EDITOR)
    findAssigned(@Req() req: any, @Query('role') role?: string) {
        // Ideally role is derived from token
        // passing user ID to filter
        return this.locationsService.findAllAoi(req.user.role, req.user.userId);
    }

    // --- Verified: Assign AOI ---
    @Patch(':id/assign')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    assign(@Param('id') id: string, @Body() assignDto: AssignAoiDto, @Req() req: any) {
        return this.locationsService.assignAoi(id, assignDto.surveyor_id, req.user.userId);
    }

    // --- Verified: Update AOI Details ---
    @Patch(':id')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    update(@Param('id') id: string, @Body() updateAoiDto: UpdateAoiDto) {
        return this.locationsService.updateAoi(id, updateAoiDto);
    }

    // --- Verified: Surveyor Start AOI ---
    @Patch(':id/start')
    @Roles(RoleSlug.SURVEYOR)
    start(@Param('id') id: string, @Req() req: any) {
        return this.locationsService.updateAoiStatus(id, 'IN_PROGRESS', req.user.userId);
    }

    // --- Verified: Surveyor Submit AOI ---
    @Patch(':id/submit')
    @Roles(RoleSlug.SURVEYOR)
    submit(@Param('id') id: string, @Req() req: any) {
        return this.locationsService.updateAoiStatus(id, 'SUBMITTED', req.user.userId);
    }

    // --- Verified: Close AOI ---
    @Patch(':id/close')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    close(@Param('id') id: string, @Req() req: any) {
        return this.locationsService.updateAoiStatus(id, 'CLOSED', req.user.userId);
    }
}
