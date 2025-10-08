import { Module } from '@nestjs/common';
import { HelperService } from './helper.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelperEntity } from './entities/helper.entity';
import { HelperController } from './helper.controller';
import { MediaModule } from '../media/media.module';
import { UploadService } from 'src/common/services/upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([HelperEntity]), MediaModule],
  controllers: [HelperController],
  providers: [HelperService, UploadService],
  exports: [HelperService]
})
export class HelperModule { }
