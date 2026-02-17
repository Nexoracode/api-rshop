import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreInfoEntity } from './entities/store-info.entity';
import { FaqEntity } from './entities/faq.entity';
import { FaqCategoryEntity } from './entities/faq-category.entity';
import { CreateStoreInfoDto } from './dto/create-store-info.dto';
import { UpdateStoreInfoDto } from './dto/update-store-info.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { CreateFaqCategoryDto, UpdateFaqCategoryDto } from './dto/faq-category.dto';
import { StoreInfoMapper } from './mappers/store-info.mapper';
import { StoreInfoType } from './enums/store-info.enum';
import { IFaqGroupedByCategory, IStoreInfoResponse } from './interfaces/store-info.interface';

@Injectable()
export class StoreInfoService {
  constructor(
    @InjectRepository(StoreInfoEntity)
    private readonly storeInfoRepo: Repository<StoreInfoEntity>,
    @InjectRepository(FaqEntity)
    private readonly faqRepo: Repository<FaqEntity>,
    @InjectRepository(FaqCategoryEntity)
    private readonly faqCategoryRepo: Repository<FaqCategoryEntity>,
  ) { }

  // ─── Store Info ────────────────────────────────────────────────────────────

  async createStoreInfo(dto: CreateStoreInfoDto): Promise<IStoreInfoResponse> {
    const existing = await this.storeInfoRepo.findOne({ where: { type: dto.type } });
    if (existing) {
      throw new ConflictException(`صفحه‌ای با نوع "${dto.type}" قبلاً ثبت شده است. از آپدیت استفاده کنید.`);
    }
    const entity = this.storeInfoRepo.create(dto);
    const saved = await this.storeInfoRepo.save(entity);
    return StoreInfoMapper.toResponse(saved);
  }

  async updateStoreInfo(type: StoreInfoType, dto: UpdateStoreInfoDto): Promise<IStoreInfoResponse> {
    const entity = await this.storeInfoRepo.findOne({ where: { type } });
    if (!entity) throw new NotFoundException(`صفحه "${type}" یافت نشد.`);
    const merged = this.storeInfoRepo.merge(entity, dto);
    const saved = await this.storeInfoRepo.save(merged);
    return StoreInfoMapper.toResponse(saved);
  }

  async upsertStoreInfo(dto: CreateStoreInfoDto): Promise<IStoreInfoResponse> {
    let entity = await this.storeInfoRepo.findOne({ where: { type: dto.type } });
    if (entity) {
      const merged = this.storeInfoRepo.merge(entity, dto);
      const saved = await this.storeInfoRepo.save(merged);
      return StoreInfoMapper.toResponse(saved);
    }
    const newEntity = this.storeInfoRepo.create(dto);
    const saved = await this.storeInfoRepo.save(newEntity);
    return StoreInfoMapper.toResponse(saved);
  }

  async getStoreInfoByType(type: StoreInfoType): Promise<IStoreInfoResponse> {
    const entity = await this.storeInfoRepo.findOne({ where: { type } });
    if (!entity) throw new NotFoundException(`صفحه "${type}" یافت نشد.`);
    return StoreInfoMapper.toResponse(entity);
  }

  async getAllStoreInfo(): Promise<IStoreInfoResponse[]> {
    const items = await this.storeInfoRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
    return items.map(StoreInfoMapper.toResponse);
  }

  async getActiveStoreInfo(): Promise<IStoreInfoResponse[]> {
    const items = await this.storeInfoRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
    return items.map(StoreInfoMapper.toResponse);
  }

  async getAboutUs() { return this.getStoreInfoByType(StoreInfoType.ABOUT_US); }
  async getPurchaseGuide() { return this.getStoreInfoByType(StoreInfoType.PURCHASE_GUIDE); }
  async getReturnPolicy() { return this.getStoreInfoByType(StoreInfoType.RETURN_POLICY); }

  // ─── FAQ Categories ────────────────────────────────────────────────────────

  async createFaqCategory(dto: CreateFaqCategoryDto) {
    const existing = await this.faqCategoryRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`دسته‌بندی "${dto.name}" قبلاً وجود دارد.`);
    const entity = this.faqCategoryRepo.create(dto);
    const saved = await this.faqCategoryRepo.save(entity);
    return StoreInfoMapper.toFaqCategoryResponse(saved);
  }

  async updateFaqCategory(id: number, dto: UpdateFaqCategoryDto) {
    const entity = await this.faqCategoryRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException('دسته‌بندی FAQ یافت نشد.');
    if (dto.name && dto.name !== entity.name) {
      const existing = await this.faqCategoryRepo.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException(`دسته‌بندی "${dto.name}" قبلاً وجود دارد.`);
    }
    const merged = this.faqCategoryRepo.merge(entity, dto);
    const saved = await this.faqCategoryRepo.save(merged);
    return StoreInfoMapper.toFaqCategoryResponse(saved);
  }

  async deleteFaqCategory(id: number) {
    const entity = await this.faqCategoryRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException('دسته‌بندی FAQ یافت نشد.');
    // FAQهای این دسته به faqCategoryId=null تبدیل می‌شوند (onDelete: SET NULL)
    await this.faqCategoryRepo.remove(entity);
    return { message: 'دسته‌بندی FAQ با موفقیت حذف شد.' };
  }

  async getAllFaqCategories(onlyActive = false) {
    const where = onlyActive ? { isActive: true } : {};
    const items = await this.faqCategoryRepo.find({
      where,
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
    return items.map(StoreInfoMapper.toFaqCategoryResponse);
  }

  async getFaqCategoryById(id: number) {
    const entity = await this.faqCategoryRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException('دسته‌بندی FAQ یافت نشد.');
    return StoreInfoMapper.toFaqCategoryResponse(entity);
  }

  // ─── FAQ Entries ───────────────────────────────────────────────────────────

  async createFaq(dto: CreateFaqDto) {
    if (dto.faqCategoryId) {
      const cat = await this.faqCategoryRepo.findOneBy({ id: dto.faqCategoryId });
      if (!cat) throw new NotFoundException(`دسته‌بندی FAQ با شناسه ${dto.faqCategoryId} یافت نشد.`);
    }
    const faq = this.faqRepo.create(dto);
    const saved = await this.faqRepo.save(faq);
    const withRelation = await this.faqRepo.findOne({
      where: { id: saved.id },
      relations: ['faqCategory'],
    });
    return StoreInfoMapper.toFaqResponse(withRelation!);
  }

  async updateFaq(id: number, dto: UpdateFaqDto) {
    const faq = await this.faqRepo.findOne({ where: { id }, relations: ['faqCategory'] });
    if (!faq) throw new NotFoundException('سوال متداول یافت نشد.');
    if (dto.faqCategoryId !== undefined && dto.faqCategoryId !== null) {
      const cat = await this.faqCategoryRepo.findOneBy({ id: dto.faqCategoryId });
      if (!cat) throw new NotFoundException(`دسته‌بندی FAQ با شناسه ${dto.faqCategoryId} یافت نشد.`);
    }
    const merged = this.faqRepo.merge(faq, dto);
    const saved = await this.faqRepo.save(merged);
    const withRelation = await this.faqRepo.findOne({
      where: { id: saved.id },
      relations: ['faqCategory'],
    });
    return StoreInfoMapper.toFaqResponse(withRelation!);
  }

  async deleteFaq(id: number) {
    const faq = await this.faqRepo.findOneBy({ id });
    if (!faq) throw new NotFoundException('سوال متداول یافت نشد.');
    await this.faqRepo.remove(faq);
    return { message: 'سوال متداول با موفقیت حذف شد.' };
  }

  async getFaqById(id: number) {
    const faq = await this.faqRepo.findOne({ where: { id }, relations: ['faqCategory'] });
    if (!faq) throw new NotFoundException('سوال متداول یافت نشد.');
    await this.faqRepo.increment({ id }, 'viewCount', 1);
    return StoreInfoMapper.toFaqResponse({ ...faq, viewCount: faq.viewCount + 1 });
  }

  async getAllFaqs(onlyActive = false) {
    const where = onlyActive ? { isActive: true } : {};
    const faqs = await this.faqRepo.find({
      where,
      relations: ['faqCategory'],
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
    return faqs.map(StoreInfoMapper.toFaqResponse);
  }

  async getFaqsGroupedByCategory(): Promise<IFaqGroupedByCategory[]> {
    const faqs = await this.faqRepo.find({
      where: { isActive: true },
      relations: ['faqCategory'],
      order: { displayOrder: 'ASC', id: 'ASC' },
    });

    // گروه‌بندی بر اساس faqCategory
    const grouped = new Map<number | 'uncategorized', { category: any; faqs: FaqEntity[] }>();

    for (const faq of faqs) {
      const key = faq.faqCategoryId ?? 'uncategorized';
      if (!grouped.has(key)) {
        grouped.set(key, { category: faq.faqCategory ?? null, faqs: [] });
      }
      grouped.get(key)!.faqs.push(faq);
    }

    return Array.from(grouped.values()).map(({ category, faqs: items }) => ({
      category: category ? StoreInfoMapper.toFaqCategoryResponse(category) : null,
      faqs: items.map(StoreInfoMapper.toFaqResponse),
    }));
  }

  async bulkDeleteFaqs(ids: number[]) {
    const faqs = await this.faqRepo.findByIds(ids);
    if (faqs.length === 0) throw new NotFoundException('هیچ سوالی یافت نشد.');
    await this.faqRepo.remove(faqs);
    return { message: `${faqs.length} سوال با موفقیت حذف شد.` };
  }
}
