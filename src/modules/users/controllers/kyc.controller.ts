import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { KycService } from '../services/kyc.service';
import { SubmitKycDto } from '../dto/submit-kyc.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('surveyor/kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
    constructor(private readonly kycService: KycService) { }

    @Post()
    async submit(@Request() req: any, @Body() dto: SubmitKycDto) {
        return this.kycService.submitKyc(req.user.id, dto);
    }

    @Get('status')
    async getStatus(@Request() req: any) {
        return this.kycService.getStatus(req.user.id);
    }
}
