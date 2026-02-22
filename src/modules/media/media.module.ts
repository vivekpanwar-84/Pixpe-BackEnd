import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Photo } from './entities/photo.entity';
import { PoiForm } from '../workflow/entities/poi-form.entity';
import { MediaService } from './media.service';
import { PhotosController } from './photos.controller';
import { FormsController } from './forms.controller';
import { SupabaseService } from './supabase.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Photo, PoiForm]),
        MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }), // 10MB max
    ],
    controllers: [PhotosController, FormsController],
    providers: [MediaService, SupabaseService],
    exports: [MediaService, TypeOrmModule, SupabaseService],
})
export class MediaModule { }
