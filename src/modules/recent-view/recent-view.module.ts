import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecentView } from './entities/recent-view.entity';
import { RecentViewService } from './recent-view.service';
import { RecentViewController } from './recent-view.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecentView])],
  controllers: [RecentViewController],
  providers: [RecentViewService],
  exports: [RecentViewService],
})
export class RecentViewModule { }
