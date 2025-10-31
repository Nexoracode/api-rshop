import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { WishlistMapper } from './mappers/wishlist.mapper';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,
  ) { }

  async add(user: RequestUser, dto: CreateWishlistDto) {
    const exists = await this.wishlistRepo.findOne({
      where: { userId: user.id, productId: dto.productId },
    });

    if (exists)
      throw new ConflictException('این محصول قبلاً در لیست علاقه‌مندی‌ها وجود دارد.');

    const wishlist = this.wishlistRepo.create({
      userId: user.id,
      productId: dto.productId,
    });
    return await this.wishlistRepo.save(wishlist);
  }

  async getAll(user: RequestUser) {
    const list = await this.wishlistRepo.find({
      where: { userId: user.id },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
    return WishlistMapper.toList(list);
  }

  async remove(user: RequestUser, id: number) {
    const wishlist = await this.wishlistRepo.findOne({
      where: { id, userId: user.id },
    });

    if (!wishlist) throw new NotFoundException('آیتم یافت نشد.');

    await this.wishlistRepo.remove(wishlist);
    return { message: 'محصول از لیست علاقه‌مندی‌ها حذف شد.' };
  }
}
