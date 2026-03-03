import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateRewardRequestDto, UpdateRewardStatusDto } from './dto/reward.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleSlug } from '../../common/constants/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('rewards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RewardsController {
    constructor(private readonly workflowService: WorkflowService) { }

    // --- Surveyor: Request Payout / Submit Stats ---
    @Post('request')
    @Roles(RoleSlug.SURVEYOR)
    createRequest(@Body() createDto: CreateRewardRequestDto, @Req() req: any) {
        return this.workflowService.createRewardRequest(createDto, req.user.id);
    }

    // --- Surveyor: View Earnings ---
    @Get('my-earnings')
    @Roles(RoleSlug.SURVEYOR)
    findMyEarnings(@Req() req: any) {
        return this.workflowService.findMyRewards(req.user.id);
    }

    // --- Manager/Admin: View All Requests ---
    @Get()
    @Roles(RoleSlug.MANAGER, RoleSlug.ADMIN)
    findAll(@Query('status') status?: string) {
        return this.workflowService.findAllRewards(status); // Add pagination ideally
    }

    // --- Manager: Approve/Reject ---
    @Patch(':id/status')
    @Roles(RoleSlug.MANAGER, RoleSlug.ADMIN)
    updateStatus(@Param('id') id: string, @Body() updateDto: UpdateRewardStatusDto, @Req() req: any) {
        // Logic check: Manager can approve/reject, Admin can pay.
        // Service handles payment check (must be approved first).
        // Here strict role check could be added if needed?
        // For now relying on trusted roles.
        return this.workflowService.updateRewardStatus(id, updateDto, req.user.id);
    }

    // --- Admin: Dashboard Stats ---
    @Get('stats')
    @Roles(RoleSlug.ADMIN)
    getStats() {
        return this.workflowService.getStats();
    }
}
