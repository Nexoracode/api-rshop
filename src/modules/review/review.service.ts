import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { User } from '../user/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { ReviewMapper } from './mappers/review.mapper';
import { FilterOperator, paginate, PaginateQuery } from 'nestjs-paginate';
import { getAverageRating } from 'src/common/helpers/review.helper';
import { buildPriceObject } from 'src/common/helpers/price.helper';
import { OrderItem } from '../order/entities/order-item.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    private readonly dataSource: DataSource,
  ) { }

  async create(user: User, dto: CreateReviewDto) {
    const review = this.reviewRepo.create({ ...dto, userId: user.id });
    return await this.reviewRepo.save(review);
  }

  async findAllByUser(userId: number) {
    const list = await this.reviewRepo.find({
      where: { user: { id: userId } },
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
    });
    return ReviewMapper.toList(list);
  }

  async findAllByProduct(productId: number, query: PaginateQuery) {
    // return this.reviewRepo.find({
    //   where: { productId: productId, isApproved: true },
    //   relations: ['user'],
    //   order: { createdAt: 'DESC' },
    // }); 
    const reviews = await paginate(query, this.reviewRepo, {
      sortableColumns: ['createdAt', 'id'],
      relations: ['user'],
      where: { productId, isApproved: true }
    })
    return {
      averegeRating: getAverageRating(reviews.data),
      count: reviews.data.length,
      data: reviews.data,
      meta: reviews.meta,
    };
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

  async removeByAdmin(id: number) {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('نظر یافت نشد');
    await this.reviewRepo.remove(review);
    return { message: 'نظر با موفقیت حذف شد' };
  }

  async findAllForAdmin(query: PaginateQuery) {
    const response = await paginate(query, this.reviewRepo, {
      sortableColumns: ['createdAt', 'id'],
      relations: ['product', 'product.mediaPinned', 'user'],
      searchableColumns: ['comment', 'product.name'],
      filterableColumns: {
        productId: [FilterOperator.EQ],
        userId: [FilterOperator.EQ],
        isApproved: [FilterOperator.EQ],
      },
      defaultSortBy: [['createdAt', 'DESC']],
    });
    return {
      items: ReviewMapper.toList(response.data),
      meta: response.meta,
      links: response.links,
    }
  }

  async updateStatus(id: number, dto: UpdateReviewStatusDto) {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('نظر یافت نشد');
    review.isApproved = dto.isApproved;
    return this.reviewRepo.save(review);
  }

  async findPendingReviews(userId: number) {
    const products = await this.dataSource
      .getRepository(OrderItem)
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .innerJoin('item.product', 'product')
      .leftJoin('product.mediaPinned', 'media')
      .leftJoin(
        Review,
        'review',
        'review.product_id = product.id AND review.user_id = :userId',
        { userId },
      )
      .where('order.user_id = :userId', { userId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['paid', 'delivered'],
      })
      .andWhere('review.id IS NULL')
      .groupBy('product.id')
      .select([
        'product.id AS id',
        'product.name AS name',
        'product.price AS price',
        'product.discount_amount AS discountAmount',
        'product.discount_percent AS discountPercent',
        'media.url AS image',
      ])
      .getRawMany();

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image,
      ...buildPriceObject({
        price: p.price,
        discountAmount: p.discountAmount,
        discountPercent: p.discountPercent,
      }),
    }));
  }
}
