import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AoiArea } from './entities/aoi-area.entity';
import { Photo } from '../media/entities/photo.entity';
import { LocationsService } from './locations.service';
import { AoiController } from './aoi.controller';

@Module({
    imports: [TypeOrmModule.forFeature([AoiArea, Photo])],
    controllers: [AoiController],
    providers: [LocationsService],
    exports: [LocationsService, TypeOrmModule],
})
export class LocationsModule { }
