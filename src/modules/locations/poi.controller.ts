import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreatePoiDto, UpdatePoiDto, VerifyPoiDto, AssignPoiDto } from './dto/poi.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleSlug } from '../../common/constants/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('poi')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PoiController {
    constructor(private readonly locationsService: LocationsService) { }

    // --- Verified: Surveyor Create POI ---
    @Post()
    @Roles(RoleSlug.SURVEYOR)
    create(@Body() createPoiDto: CreatePoiDto, @Req() req: any) {
        return this.locationsService.createPoi(createPoiDto, req.user.userId);
    }

    // --- Verified: Surveyor Update Own POI ---
    @Patch(':id')
    @Roles(RoleSlug.SURVEYOR)
    update(@Param('id') id: string, @Body() updatePoiDto: UpdatePoiDto, @Req() req: any) {
        return this.locationsService.updatePoi(id, updatePoiDto, req.user.userId);
    }

    @Get(':id')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER, RoleSlug.SURVEYOR, RoleSlug.EDITOR)
    getOne(@Param('id') id: string) {
        return this.locationsService.findOnePoi(id);
    }

    // --- Verified: Editor View Assigned POIs ---
    @Get('assigned')
    @Roles(RoleSlug.EDITOR)
    findAssigned(@Req() req: any) {
        return this.locationsService.findAllPoi(req.user.role, req.user.userId);
    }

    // --- Verified: Admin View All POIs --- (Optional based on user list, but good to have)
    @Get()
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER, RoleSlug.SURVEYOR)
    findAll(@Req() req: any, @Query('aoi_id') aoiId?: string) {
        return this.locationsService.findAllPoi(req.user.role, req.user.userId, aoiId);
    }

    // --- Verified: Admin/Manager Verify POI ---
    @Patch(':id/verify')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    verify(@Param('id') id: string, @Body() verifyDto: VerifyPoiDto, @Req() req: any) {
        return this.locationsService.verifyPoi(id, verifyDto, req.user.userId);
    }

    // --- Manager: Assign POI to Editor ---
    @Patch(':id/assign')
    @Roles(RoleSlug.MANAGER, RoleSlug.ADMIN)
    assign(@Param('id') id: string, @Body() assignDto: AssignPoiDto, @Req() req: any) {
        return this.locationsService.assignPoi(id, assignDto.editor_id, req.user.userId);
    }
}
