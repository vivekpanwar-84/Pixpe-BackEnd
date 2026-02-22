import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleSlug } from '../../common/constants/roles.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateKycStatusDto, ChangeRoleDto, UpdateStatusDto, UpdateProfileDto } from './dto/user-operations.dto';
import { KycStatus } from './entities/user.entity';

import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { memoryStorage } from 'multer';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // --- 1. Admin/Manager: Create User ---
    @Post()
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.createUser(createUserDto);
    }

    // --- 2. Admin/Manager: List Users ---
    @Get()
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    findAll(@Query('role') role?: string) {
        return this.usersService.findAll(role);
    }

    // --- 3. Manager: View Pending KYC ---
    @Get('kyc-pending')
    @Roles(RoleSlug.MANAGER, RoleSlug.ADMIN)
    findPendingKyc() {
        return this.usersService.findPendingKyc();
    }

    // --- 4. User: View Own Profile ---
    @Get('profile')
    async getProfile(@Req() req: any) {
        return this.usersService.findOne(req.user.userId);
    }

    // --- 5. User: View Own KYC Status ---
    @Get('kyc/status')
    async getMyKycStatus(@Req() req: any) {
        const user = await this.usersService.findOne(req.user.userId);
        return { kyc_status: user.kyc_status, is_verified: user.is_kyc_verified, reason: user.kyc_rejected_reason };
    }

    // --- 5. Admin: View Specific User ---
    @Get(':id')
    @Roles(RoleSlug.ADMIN)
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    // --- 6. Surveyor/All: Update Own Profile ---
    @Patch('profile')
    updateProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
        return this.usersService.update(req.user.userId, updateProfileDto);
    }

    // --- 7. Admin: Update User Details ---
    @Patch(':id')
    @Roles(RoleSlug.ADMIN)
    update(@Param('id') id: string, @Body() updateUserDto: UpdateProfileDto) {
        return this.usersService.update(id, updateUserDto);
    }

    // --- 8. Admin: Change User Role ---
    @Patch(':id/role')
    @Roles(RoleSlug.ADMIN)
    changeRole(@Param('id') id: string, @Body() changeRoleDto: ChangeRoleDto) {
        return this.usersService.updateRole(id, changeRoleDto.role);
    }

    // --- 9. Manager: Activate/Deactivate User ---
    @Patch(':id/status')
    @Roles(RoleSlug.MANAGER, RoleSlug.ADMIN)
    updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
        return this.usersService.updateStatus(id, updateStatusDto.isActive);
    }

    // --- 10. Start KYC (Submit) ---
    @Post('kyc')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    async submitKyc(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('KYC document file is required. Send as form-data with key "file".');
        }
        return this.usersService.submitKycDocument(req.user.userId, file);
    }

    // --- 11. Admin/Manager: Approve/Reject KYC ---
    @Patch(':id/kyc-status')
    @Roles(RoleSlug.ADMIN, RoleSlug.MANAGER)
    updateKycStatus(@Param('id') id: string, @Body() dto: UpdateKycStatusDto, @Req() req: any) {
        return this.usersService.updateKycStatus(id, dto.status, dto.reason, req.user.userId);
    }

    // --- 12. Admin: Soft Delete User ---
    @Delete(':id')
    @Roles(RoleSlug.ADMIN)
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
