import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewAdminController } from './review-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Review])],
  controllers: [ReviewController, ReviewAdminController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule { }
