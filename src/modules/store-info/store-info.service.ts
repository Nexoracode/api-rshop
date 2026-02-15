import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreInfoEntity } from './entities/store-info.entity';
import { FaqEntity } from './entities/faq.entity';
import { CreateStoreInfoDto } from './dto/create-store-info.dto';
import { UpdateStoreInfoDto } from './dto/update-store-info.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { StoreInfoMapper } from './mappers/store-info.mapper';
import { StoreInfoType, StoreInfoStatus } from './enums/store-info.enum';
import { IFaqGroupedByCategory, IStoreInfoResponse } from './interfaces/store-info.interface';

@Injectable()
export class StoreInfoService {
  constructor(
    @InjectRepository(StoreInfoEntity)
    private readonly storeInfoRepo: Repository<StoreInfoEntity>,
    @InjectRepository(FaqEntity)
    private readonly faqRepo: Repository<FaqEntity>,
  ) { }

  // ─── Store Info (About Us / Purchase Guide / Return Policy / FAQ Page) ───────

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
    if (!entity) {
      throw new NotFoundException(`صفحه "${type}" یافت نشد. ابتدا آن را ایجاد کنید.`);
    }
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
    if (!entity) {
      throw new NotFoundException(`صفحه "${type}" یافت نشد.`);
    }
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

  // ─── About Us ──────────────────────────────────────────────────────────────

  async getAboutUs(): Promise<IStoreInfoResponse> {
    return this.getStoreInfoByType(StoreInfoType.ABOUT_US);
  }

  // ─── Purchase Guide ────────────────────────────────────────────────────────

  async getPurchaseGuide(): Promise<IStoreInfoResponse> {
    return this.getStoreInfoByType(StoreInfoType.PURCHASE_GUIDE);
  }

  // ─── Return Policy ─────────────────────────────────────────────────────────

  async getReturnPolicy(): Promise<IStoreInfoResponse> {
    return this.getStoreInfoByType(StoreInfoType.RETURN_POLICY);
  }

  // ─── FAQ Entries ───────────────────────────────────────────────────────────

  async createFaq(dto: CreateFaqDto) {
    const faq = this.faqRepo.create(dto);
    const saved = await this.faqRepo.save(faq);
    return StoreInfoMapper.toFaqResponse(saved);
  }

  async updateFaq(id: number, dto: UpdateFaqDto) {
    const faq = await this.faqRepo.findOneBy({ id });
    if (!faq) throw new NotFoundException('سوال متداول یافت نشد.');
    const merged = this.faqRepo.merge(faq, dto);
    const saved = await this.faqRepo.save(merged);
    return StoreInfoMapper.toFaqResponse(saved);
  }

  async deleteFaq(id: number) {
    const faq = await this.faqRepo.findOneBy({ id });
    if (!faq) throw new NotFoundException('سوال متداول یافت نشد.');
    await this.faqRepo.remove(faq);
    return { message: 'سوال متداول با موفقیت حذف شد.' };
  }

  async getFaqById(id: number) {
    const faq = await this.faqRepo.findOneBy({ id });
    if (!faq) throw new NotFoundException('سوال متداول یافت نشد.');
    // افزایش شمارنده بازدید
    await this.faqRepo.increment({ id }, 'viewCount', 1);
    return StoreInfoMapper.toFaqResponse({ ...faq, viewCount: faq.viewCount + 1 });
  }

  async getAllFaqs(onlyActive = false) {
    const where = onlyActive ? { isActive: true } : {};
    const faqs = await this.faqRepo.find({
      where,
      order: { displayOrder: 'ASC', id: 'ASC' },
    });
    return faqs.map(StoreInfoMapper.toFaqResponse);
  }

  async getFaqsGroupedByCategory(): Promise<IFaqGroupedByCategory[]> {
    const faqs = await this.faqRepo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', id: 'ASC' },
    });

    const grouped = new Map<string, typeof faqs>();
    for (const faq of faqs) {
      const cat = faq.category ?? 'عمومی';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(faq);
    }

    return Array.from(grouped.entries()).map(([category, items]) => ({
      category,
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
