import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './entities/photo.entity';
import { PoiForm } from '../workflow/entities/poi-form.entity';
import { MediaService } from './media.service';
import { PhotosController } from './photos.controller';
import { FormsController } from './forms.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Photo, PoiForm])],
    controllers: [PhotosController, FormsController],
    providers: [MediaService],
    exports: [MediaService, TypeOrmModule],
})
export class MediaModule { }
