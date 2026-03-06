import { Controller, Post, Get, Body, UseGuards, Request, Req, UseInterceptors, UploadedFile, BadRequestException, Logger } from '@nestjs/common';
import { KycService } from '../services/kyc.service';
import { SubmitKycDto } from '../dto/submit-kyc.dto';
import { KycUploadDto } from '../dto/kyc-upload.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('surveyor/kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
    private readonly logger = new Logger(KycController.name);
    constructor(private readonly kycService: KycService) { }

    @Post()
    async submit(@Request() req: any, @Body() dto: SubmitKycDto) {
        return this.kycService.submitKyc(req.user.id, dto);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
        @Req() req: any
    ) {
        this.logger.log(`DEBUG_UPLOAD_START: user=${req.user?.id} body=${JSON.stringify(body)}`);

        if (!file) {
            this.logger.error('DEBUG: No file object received by NestJS');
            throw new BadRequestException('ERR_FILE_MISSING_IN_CONTROLLER_DEBUG_123');
        }

        const type = body?.type;
        if (!type) {
            this.logger.error('DEBUG: No type field in body');
            throw new BadRequestException('ERR_TYPE_MISSING_IN_CONTROLLER_DEBUG_123');
        }

        return this.kycService.uploadKycDocument(req.user.id, file, type);
    }

    @Get('upload')
    async uploadDebug() {
        return { message: 'KYC Upload endpoint is active. Please use POST method to upload files.' };
    }

    @Get('status')
    async getStatus(@Request() req: any) {
        return this.kycService.getStatus(req.user.id);
    }
}
