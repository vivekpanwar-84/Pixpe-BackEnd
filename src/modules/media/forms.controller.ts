import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateFormDto, UpdateFormStatusDto } from './dto/form.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleSlug } from '../../common/constants/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('forms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormsController {
    constructor(private readonly mediaService: MediaService) { }

    // --- Verified: Editor Submit Form Data ---
    @Post()
    @Roles(RoleSlug.EDITOR)
    create(@Body() createFormDto: CreateFormDto, @Req() req: any) {
        return this.mediaService.createForm(createFormDto, req.user.userId);
    }

    // --- Verified: Manager View All Forms ---
    @Get()
    @Roles(RoleSlug.MANAGER, RoleSlug.ADMIN)
    findAll(@Query('status') status?: string) {
        return this.mediaService.findAllForms(status);
    }

    // --- Verified: Manager Approve/Reject Form ---
    @Patch(':id/status')
    @Roles(RoleSlug.MANAGER, RoleSlug.ADMIN)
    updateStatus(@Param('id') id: string, @Body() statusDto: UpdateFormStatusDto, @Req() req: any) {
        return this.mediaService.updateFormStatus(id, statusDto, req.user.userId);
    }
}
