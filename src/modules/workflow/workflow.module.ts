import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoiForm } from './entities/poi-form.entity';
import { Reward } from './entities/reward.entity';
import { WorkflowService } from './workflow.service';
import { RewardsController } from './rewards.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Reward])],
    controllers: [RewardsController],
    providers: [WorkflowService],
    exports: [WorkflowService, TypeOrmModule],
})
export class WorkflowModule { }
