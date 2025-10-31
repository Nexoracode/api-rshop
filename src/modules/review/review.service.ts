import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { User } from '../user/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) { }

  async create(user: User, dto: CreateReviewDto) {
    const review = this.reviewRepo.create({ ...dto, userId: user.id });
    return await this.reviewRepo.save(review);
  }

  async findAllByUser(userId: number) {
    return this.reviewRepo.find({
      where: { userId: userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByProduct(productId: number) {
    return this.reviewRepo.find({
      where: { productId: productId, isApproved: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(userId: number, id: number, dto: UpdateReviewDto) {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('نظر یافت نشد');
    if (review.userId !== userId) throw new ForbiddenException('اجازه ویرایش ندارید');

    Object.assign(review, dto);
    return await this.reviewRepo.save(review);
  }

  async remove(userId: number, id: number) {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('نظر یافت نشد');
    if (review.userId !== userId) throw new ForbiddenException('اجازه حذف ندارید');

    await this.reviewRepo.remove(review);
    return { message: 'نظر با موفقیت حذف شد' };
  }

  async findAllForAdmin() {
    return this.reviewRepo.find({
      relations: ['product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: number, dto: UpdateReviewStatusDto) {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('نظر یافت نشد');
    review.isApproved = dto.isApproved;
    return this.reviewRepo.save(review);
  }

}
