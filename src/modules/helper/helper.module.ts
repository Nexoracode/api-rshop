import { Module } from '@nestjs/common';
import { HelperService } from './helper.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelperEntity } from './entites/helper.entity';
import { HelperController } from './helper.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HelperEntity])],
  controllers: [HelperController],
  providers: [HelperService],
  exports: [HelperService]
})
export class HelperModule { }
