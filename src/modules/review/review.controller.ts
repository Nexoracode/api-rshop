import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Patch, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { AccessGuard } from 'src/common/guard/access.guard';
import { User } from '../user/entities/user.entity';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { Paginate, PaginateQuery } from 'nestjs-paginate';


@ApiTags('Profile - Reviews')
@Controller('profile/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) { }

  @UseGuards(AccessGuard)
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
    return this.reviewService.create(user, dto);
  }

  @UseGuards(AccessGuard)
  @Get()
  findAll(@CurrentUser() user: User) {
    return this.reviewService.findAllByUser(user.id);
  }

  @Public()
  @Get('products/:id')
  findAllProducts(@Param('id', ParseIntPipe) id: number, @Paginate() query: PaginateQuery) {
    return this.reviewService.findAllByProduct(id, query);
  }

  @UseGuards(AccessGuard)
  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewService.update(user.id, id, dto);
  }

  @UseGuards(AccessGuard)
  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: number) {
    return this.reviewService.remove(user.id, id);
  }

  @UseGuards(AccessGuard)
  @Get('pending')
  @ApiOperation({ summary: 'لیست محصولاتی که هنوز برایشان نظر ثبت نشده' })
  getPending(@CurrentUser() user: User) {
    return this.reviewService.findPendingReviews(user.id);
  }
}
