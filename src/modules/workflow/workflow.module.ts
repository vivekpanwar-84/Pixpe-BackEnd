import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoiForm } from './entities/poi-form.entity';
import { Form } from './entities/form.entity';
import { Reward } from './entities/reward.entity';
import { WorkflowService } from './workflow.service';
import { RewardsController } from './rewards.controller';
import { SystemModule } from '../system/system.module';
import { AoiArea } from '../locations/entities/aoi-area.entity';
import { Photo } from '../media/entities/photo.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Reward, Form, PoiForm, AoiArea, Photo]),
        SystemModule,
    ],
    controllers: [RewardsController],
    providers: [WorkflowService],
    exports: [WorkflowService, TypeOrmModule],
})
export class WorkflowModule { }
