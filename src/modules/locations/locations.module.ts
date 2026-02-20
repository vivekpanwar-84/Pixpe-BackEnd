import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AoiArea } from './entities/aoi-area.entity';
import { PoiPoint } from './entities/poi-point.entity';
import { LocationsService } from './locations.service';
import { AoiController } from './aoi.controller';
import { PoiController } from './poi.controller';

@Module({
    imports: [TypeOrmModule.forFeature([AoiArea, PoiPoint])],
    controllers: [AoiController, PoiController],
    providers: [LocationsService],
    exports: [LocationsService, TypeOrmModule],
})
export class LocationsModule { }
