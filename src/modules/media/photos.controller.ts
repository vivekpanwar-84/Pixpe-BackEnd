import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadPhotoDto, UpdatePhotoStatusDto, AssignPhotoDto } from './dto/photo.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleSlug } from '../../common/constants/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { memoryStorage } from 'multer';

@Controller('photos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PhotosController {
    constructor(private readonly mediaService: MediaService) { }

    // --- Surveyor: Upload Photo to Supabase ---
    @Post('upload')
    @Roles(RoleSlug.SURVEYOR)
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    async create(
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadPhotoDto: UploadPhotoDto,
        @Req() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('Photo file is required. Send as form-data with key "file".');
        }
        return this.mediaService.uploadPhoto(file, uploadPhotoDto, req.user.userId);
    }

    // --- Surveyor: View My Uploads ---
    @Get('my-uploads')
    @Roles(RoleSlug.SURVEYOR)
    findMyUploads(@Req() req: any) {
        return this.mediaService.findMyPhotos(req.user.userId);
    }

    // --- Editor: View Assigned Photos ---
    @Get('assigned')
    @Roles(RoleSlug.EDITOR)
    findAssigned(@Req() req: any) {
        return this.mediaService.findAssignedPhotos(req.user.userId);
    }

    @Get('assigned/:id')
    @Roles(RoleSlug.EDITOR)
    findOneAssigned(@Param('id') id: string, @Req() req: any) {
        return this.mediaService.findOneAssignedPhoto(id, req.user.userId);
    }

    @Get('aoi/:aoiId/editor/:editorId')
    @Roles(RoleSlug.EDITOR, RoleSlug.ADMIN, RoleSlug.MANAGER)
    async getPhotosByAoiAndEditor(
        @Param('aoiId') aoiId: string,
        @Param('editorId') editorId: string,
    ) {
        return this.mediaService.findPhotosByAoiAndEditor(aoiId, editorId);
    }

    // --- Admin/Manager: View All Photos ---
    @Get()
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    findAll(@Query('status') status?: string) {
        return this.mediaService.findAllPhotos(status);
    }

    // --- Manager: Assign Photo to Editor ---
    @Patch(':id/assign')
    @Roles(RoleSlug.MANAGER, RoleSlug.ADMIN)
    assign(@Param('id') id: string, @Body() assignDto: AssignPhotoDto, @Req() req: any) {
        return this.mediaService.assignPhoto(id, assignDto.editor_id, req.user.userId);
    }

    // --- Manager: Approve/Reject Photo ---
    @Patch(':id/status')
    @Roles(RoleSlug.MANAGER, RoleSlug.ADMIN)
    updateStatus(@Param('id') id: string, @Body() statusDto: UpdatePhotoStatusDto, @Req() req: any) {
        return this.mediaService.updatePhotoStatus(id, statusDto, req.user.userId);
    }

    // --- Surveyor: Resubmit Rejected Photo ---
    @Patch(':id/resubmit')
    @Roles(RoleSlug.SURVEYOR)
    resubmit(@Param('id') id: string, @Req() req: any) {
        return this.mediaService.updatePhotoStatus(id, { status: 'RESUBMITTED' }, req.user.userId);
    }

    // --- Editor: Request Re-upload ---
    @Patch(':id/request-reupload')
    @Roles(RoleSlug.EDITOR)
    requestReupload(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
        return this.mediaService.updatePhotoStatus(id, { status: 'REJECTED', rejection_reason: reason }, req.user.userId);
    }

    @Delete(':id')
    @Roles(RoleSlug.SURVEYOR, RoleSlug.ADMIN)
    remove(@Param('id') id: string, @Req() req: any) {
        return this.mediaService.deletePhoto(id, req.user.userId);
    }
}
