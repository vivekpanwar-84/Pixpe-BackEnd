import { Controller, Post, Body, UseInterceptors, UploadedFile, UseGuards, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('analyze-image')
    @UseInterceptors(FileInterceptor('image'))
    async analyze(
        @UploadedFile() file: any,
        @Body('image_url') imageUrl: string,
    ) {
        if (file) {
            return this.aiService.analyzeImage(file.buffer, file.mimetype);
        } else if (imageUrl) {
            return this.aiService.analyzeImageFromUrl(imageUrl);
        } else {
            return { error: 'No image or image_url provided' };
        }
    }
}
