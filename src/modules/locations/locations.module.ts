import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AoiArea } from './entities/aoi-area.entity';
import { Photo } from '../media/entities/photo.entity';
import { AoiRequest } from './entities/aoi-request.entity';
import { LocationsService } from './locations.service';
import { AoiRequestsService } from './aoi-requests.service';
import { AoiController } from './aoi.controller';
import { AoiRequestsController } from './aoi-requests.controller';
import { SystemModule } from '../system/system.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AoiArea, Photo, AoiRequest]),
        SystemModule,
    ],
    controllers: [AoiController, AoiRequestsController],
    providers: [LocationsService, AoiRequestsService],
    exports: [LocationsService, AoiRequestsService, TypeOrmModule],
})
export class LocationsModule { }
