import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreatePhotoDto, UpdatePhotoStatusDto, AssignPhotoDto } from './dto/photo.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleSlug } from '../../common/constants/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('photos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PhotosController {
    constructor(private readonly mediaService: MediaService) { }

    // --- Verified: Surveyor Upload Photo ---
    @Post('upload')
    @Roles(RoleSlug.SURVEYOR)
    create(@Body() createPhotoDto: CreatePhotoDto, @Req() req: any) {
        return this.mediaService.createPhoto(createPhotoDto, req.user.userId);
    }

    // --- Verified: Surveyor View My Uploads ---
    @Get('my-uploads')
    @Roles(RoleSlug.SURVEYOR)
    findMyUploads(@Req() req: any) {
        return this.mediaService.findMyPhotos(req.user.userId);
    }

    // --- Verified: Editor View Assigned Photos ---
    @Get('assigned')
    @Roles(RoleSlug.EDITOR)
    findAssigned(@Req() req: any) {
        return this.mediaService.findAssignedPhotos(req.user.userId);
    }

    // --- Verified: Admin/Manager View All Photos ---
    @Get()
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    findAll(@Query('status') status?: string) {
        return this.mediaService.findAllPhotos(status);
    }

    // --- Verified: Manager Assign Photo to Editor ---
    @Patch(':id/assign')
    @Roles(RoleSlug.MANAGER, RoleSlug.ADMIN)
    assign(@Param('id') id: string, @Body() assignDto: AssignPhotoDto, @Req() req: any) {
        return this.mediaService.assignPhoto(id, assignDto.editor_id, req.user.userId);
    }

    // --- Verified: Manager Approve/Reject Photo ---
    @Patch(':id/status')
    @Roles(RoleSlug.MANAGER, RoleSlug.ADMIN)
    updateStatus(@Param('id') id: string, @Body() statusDto: UpdatePhotoStatusDto, @Req() req: any) {
        // Validate allowed status transitions if needed
        return this.mediaService.updatePhotoStatus(id, statusDto, req.user.userId);
    }

    // --- Verified: Surveyor Resubmit Rejected Photo ---
    @Patch(':id/resubmit')
    @Roles(RoleSlug.SURVEYOR)
    resubmit(@Param('id') id: string, @Req() req: any) {
        // Simplified DTO for resubmit action (status=RESUBMITTED)
        return this.mediaService.updatePhotoStatus(id, { status: 'RESUBMITTED' }, req.user.userId);
    }

    // --- Verified: Editor Request Re-upload (Reject with reason) ---
    @Patch(':id/request-reupload')
    @Roles(RoleSlug.EDITOR)
    requestReupload(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
        return this.mediaService.updatePhotoStatus(id, { status: 'REJECTED', rejection_reason: reason }, req.user.userId);
    }
}
