import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { CompareProduct } from './entities/compare.entity';
import { AddCompareDto } from './dto/add-compare.dto';
import { CompareMapper } from './mappers/compare.mapper';
import { Product } from '../product/entities/product.entity';
import { RequestUser } from 'src/common/interfaces/request-user.interface';

const MAX_COMPARE_ITEMS = 5;

const relations = [
  'user',
  'product',
  'product.category',
  'product.mediaPinned',
  'product.brand',
  "product.variants",
  "product.variants.attributes",
  "product.variants.attributes.attribute",
  "product.variants.attributes.value",
  "product.variants.attributes.attribute.group",
  'product.attributeValues',
  'product.attributeValues.attribute',
  'product.attributeValues.attribute.group',
]

@Injectable()
export class CompareService {
  constructor(
    @InjectRepository(CompareProduct)
    private readonly compareRepo: Repository<CompareProduct>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) { }

  // 🟢 افزودن محصول به لیست مقایسه
  async add(user: RequestUser, dto: AddCompareDto) {
    // قبل از اضافه کردن، compareهای قدیمی رو پاک کن (مثلاً بیشتر از ۷ روز)
    await this.compareRepo
      .createQueryBuilder()
      .delete()
      .from(CompareProduct)
      .where('user_id = :userId', { userId: user.id })
      .andWhere('created_at < NOW() - INTERVAL 1 DAY')
      .execute();

    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });

    if (!product) throw new NotFoundException('محصول یافت نشد');

    const count = await this.compareRepo.count({ where: { userId: user.id } });
    if (count >= MAX_COMPARE_ITEMS) {
      throw new NotFoundException(`شما تنها می‌توانید تا ${MAX_COMPARE_ITEMS} محصول را برای مقایسه انتخاب کنید`);
    }

    const existing = await this.compareRepo.findOne({
      where: { userId: user.id, productId: dto.productId },
      relations,
    });

    if (existing) return CompareMapper.toResponse(existing);

    const compare = this.compareRepo.create({
      userId: user.id,
      productId: dto.productId,
    });
    await this.compareRepo.save(compare);

    const full = await this.compareRepo.findOne({
      where: { id: compare.id },
      relations,
    });

    return CompareMapper.toResponse(full!);
  }

  // 🟡 دریافت لیست محصولات برای مقایسه
  async getAll(user: RequestUser) {
    const compares = await this.compareRepo.find({
      where: { userId: user.id },
      relations,
      order: { createdAt: 'DESC' },
    });

    return CompareMapper.toList(compares);
  }

  // 🔴 حذف از مقایسه
  async remove(user: RequestUser, productId: number) {
    await this.compareRepo.delete({ userId: user.id, productId });
    return { success: true, message: 'محصول از مقایسه حذف شد' };
  }
}
