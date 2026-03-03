import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleSlug } from '../../common/constants/roles.enum';
import { AoiRequestsService } from './aoi-requests.service';
import { CreateAoiRequestDto, UpdateAoiRequestStatusDto } from './dto/aoi-request.dto';

@Controller('aoi-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AoiRequestsController {
    constructor(private readonly aoiRequestsService: AoiRequestsService) { }

    @Post()
    @Roles(RoleSlug.SURVEYOR)
    create(@Body() createDto: CreateAoiRequestDto, @Req() req: any) {
        return this.aoiRequestsService.createRequest(createDto, req.user.id);
    }

    @Get('my-requests')
    @Roles(RoleSlug.SURVEYOR)
    findMyRequests(@Req() req: any) {
        return this.aoiRequestsService.findMyRequests(req.user.id);
    }

    @Get('pending')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    findAllPending() {
        return this.aoiRequestsService.findAllPending();
    }

    @Patch(':id/respond')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    respond(@Param('id') id: string, @Body() updateDto: UpdateAoiRequestStatusDto, @Req() req: any) {
        return this.aoiRequestsService.respondToRequest(id, updateDto, req.user.id);
    }
}
