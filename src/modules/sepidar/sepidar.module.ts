import { Module } from '@nestjs/common';
import { SepidarService } from './sepidar.service';
import { SepidarController } from './sepidar.controller';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [SepidarController],
  providers: [SepidarService],
  exports: [SepidarService],
})
export class SepidarModule { }
