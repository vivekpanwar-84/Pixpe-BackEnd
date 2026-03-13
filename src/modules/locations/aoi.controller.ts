import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LocationsService } from './locations.service';
import { CreateAoiDto, UpdateAoiDto, AssignAoiDto, BulkAssignAoiDto } from './dto/aoi.dto';
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
        return this.locationsService.createAoi(createAoiDto, req.user.id);
    }

    @Post('bulk')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    bulkCreate(
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('CSV file is required. Send as form-data with key "file".');
        }
        return this.locationsService.createBulkAoiFromCsv(file, req.user.id);
    }

    // --- Verified: View All AOIs (Admin/Manager) ---
    @Get()
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER, RoleSlug.SURVEYOR)
    findAll(
        @Query('unassigned') unassigned?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.locationsService.findAllAoi(
            undefined, undefined, false, unassigned === 'true',
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
            search
        );
    }

    // --- Verified: View Assigned AOIs (Surveyor/Editor) ---
    @Get('assigned')
    @Roles(RoleSlug.SURVEYOR, RoleSlug.EDITOR)
    findAssigned(
        @Req() req: any,
        @Query('hasForms') hasForms?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.locationsService.findAllAoi(
            req.user.role, req.user.id, hasForms === 'true', false,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
            search
        );
    }

    @Get('assigned/:id')
    @Roles(RoleSlug.SURVEYOR, RoleSlug.EDITOR)
    findOneAssigned(@Param('id') id: string, @Req() req: any) {
        return this.locationsService.findOneAssignedAoi(id, req.user.id, req.user.role);
    }

    // --- Verified: Assign AOI ---
    @Patch(':id/assign')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    assign(@Param('id') id: string, @Body() assignDto: AssignAoiDto, @Req() req: any) {
        if (!assignDto.surveyor_id && !assignDto.editor_id) {
            throw new BadRequestException('surveyor_id or editor_id must be provided');
        }
        return this.locationsService.assignAoi(id, assignDto, req.user.id);
    }

    @Patch('bulk-assign')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    bulkAssign(@Body() bulkDto: BulkAssignAoiDto, @Req() req: any) {
        if (!bulkDto.aoi_ids || bulkDto.aoi_ids.length === 0) {
            throw new BadRequestException('aoi_ids must be provided');
        }
        if (!bulkDto.surveyor_id && !bulkDto.editor_id) {
            throw new BadRequestException('surveyor_id or editor_id must be provided');
        }
        return this.locationsService.bulkAssignAoi(bulkDto, req.user.id);
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
        return this.locationsService.updateAoiStatus(id, 'IN_PROGRESS', req.user.id);
    }

    // --- Verified: Surveyor Submit AOI ---
    @Patch(':id/submit')
    @Roles(RoleSlug.SURVEYOR)
    submit(@Param('id') id: string, @Req() req: any) {
        return this.locationsService.updateAoiStatus(id, 'SUBMITTED', req.user.id);
    }

    // --- Verified: Close AOI ---
    @Patch(':id/close')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    close(@Param('id') id: string, @Req() req: any) {
        return this.locationsService.updateAoiStatus(id, 'CLOSED', req.user.id);
    }

    @Get(':id/stats')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER, RoleSlug.EDITOR)
    getStats(@Param('id') id: string) {
        return this.locationsService.getAoiPhotoStats(id);
    }
}
