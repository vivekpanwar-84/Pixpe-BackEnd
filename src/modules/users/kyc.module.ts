import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycDocument } from './entities/kyc-document.entity';
import { User } from './entities/user.entity';
import { KycService } from './services/kyc.service';
import { KycController } from './controllers/kyc.controller';

@Module({
    imports: [TypeOrmModule.forFeature([KycDocument, User])],
    controllers: [KycController],
    providers: [KycService],
    exports: [KycService],
})
export class KycModule { }
