import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { AccessGuard } from 'src/common/guard/access.guard';
import { User } from '../user/entities/user.entity';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';


@ApiTags('Profile - Reviews')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('profile/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) { }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.reviewService.findAllByUser(user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: number) {
    return this.reviewService.remove(user.id, id);
  }
}
