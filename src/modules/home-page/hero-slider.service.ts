import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { HeroSlider } from './entities/hero-slider.entity';
import { CreateHeroSliderDto, UpdateHeroSliderDto } from './dto/hero-slider.dto';
import { HomePageCacheService } from './cache/home-page-cache.service'; // ✅ اضافه شد
import { UpdateSortDto } from '../attributes/attribute/dto/update-sort-attribute.dto';
import { HeroSliderOrder } from './dto/her-slider-order.dto';

@Injectable()
export class HeroSliderService {
  private readonly logger = new Logger(HeroSliderService.name); // ✅ اضافه شد

  constructor(
    @InjectRepository(HeroSlider)
    private heroSliderRepository: Repository<HeroSlider>,
    private readonly cacheService: HomePageCacheService, // ✅ اضافه شد
  ) { }

  async create(createDto: CreateHeroSliderDto): Promise<HeroSlider> {
    // لاجیک اصلی (بدون تغییر)

    const lasHero = await this.heroSliderRepository.find({
      order: { displayOrder: 'DESC' },
      take: 1,
    })
    const nextOrder = lasHero.length ? lasHero[0].displayOrder + 1 : 1;
    const heroSlider = this.heroSliderRepository.create({
      ...createDto,
      displayOrder: nextOrder
    })
    const result = await this.heroSliderRepository.save(heroSlider);
    // ✅ پاک کردن cache
    await this.cacheService.clearHeroSlidersCache();
    this.logger.log('🗑️ Hero sliders cache پاک شد بعد از create');

    return result;
  }

  async findAll(): Promise<HeroSlider[]> {
    // ✅ چک cache
    const cached = await this.cacheService.getAllHeroSliders();
    if (cached) {
      this.logger.log('✅ All hero sliders از cache');
      return cached;
    }

    // لاجیک اصلی (بدون تغییر)
    const result = await this.heroSliderRepository.find({
      order: { displayOrder: 'ASC' },
    });

    // ✅ ذخیره در cache
    await this.cacheService.setAllHeroSliders(result);
    this.logger.log('💾 All hero sliders ذخیره شد در cache');

    return result;
  }

  async findAllActive(): Promise<HeroSlider[]> {
    // ✅ چک cache
    const cached = await this.cacheService.getActiveHeroSliders();
    if (cached) {
      this.logger.log('✅ Active hero sliders از cache');
      return cached;
    }

    // لاجیک اصلی (بدون تغییر)
    const result = await this.heroSliderRepository.find({
      where: { isActive: true, },
      order: { displayOrder: 'ASC' },
    });

    // ✅ ذخیره در cache
    await this.cacheService.setActiveHeroSliders(result);
    this.logger.log('💾 Active hero sliders ذخیره شد در cache');

    return result;
  }

  async findOne(id: number): Promise<HeroSlider> {
    // ✅ چک cache
    const cached = await this.cacheService.getHeroSliderById(id);
    if (cached) {
      this.logger.log(`✅ Hero slider ${id} از cache`);
      return cached;
    }

    // لاجیک اصلی (بدون تغییر)
    const slider = await this.heroSliderRepository.findOne({ where: { id } });
    if (!slider) {
      throw new NotFoundException(`Hero slider with ID ${id} not found`);
    }

    // ✅ ذخیره در cache
    await this.cacheService.setHeroSliderById(id, slider);
    this.logger.log(`💾 Hero slider ${id} ذخیره شد در cache`);

    return slider;
  }

  async update(id: number, updateDto: UpdateHeroSliderDto): Promise<HeroSlider> {
    // لاجیک اصلی (بدون تغییر)
    const slider = await this.findOne(id);
    Object.assign(slider, updateDto);
    const result = await this.heroSliderRepository.save(slider);

    // ✅ پاک کردن cache
    await this.cacheService.clearHeroSlidersCache(id);
    this.logger.log(`🗑️ Hero slider ${id} cache پاک شد بعد از update`);

    return result;
  }

  async remove(id: number): Promise<void> {
    // لاجیک اصلی (بدون تغییر)
    const slider = await this.findOne(id);
    await this.heroSliderRepository.remove(slider);
    const deletedOrder = slider.displayOrder;
    // حذف بنر    
    // دریافت بنرهایی که ترتیب بالاتری دارند
    const remainingBanners = await this.heroSliderRepository.find({
      where: { displayOrder: MoreThan(deletedOrder) },
      order: { displayOrder: 'ASC' }
    });

    // به‌روزرسانی ترتیب آنها
    for (const item of remainingBanners) {
      item.displayOrder -= 1;
      await this.heroSliderRepository.save(item);
    }

    // ✅ پاک کردن cache
    await this.cacheService.clearHeroSlidersCache(id);
    this.logger.log(`🗑️ Hero slider ${id} cache پاک شد بعد از delete`);
  }

  async updateSortOrder(id: number, data: HeroSliderOrder): Promise<{ message: string; data: null }> {
    const heroSlider = await this.heroSliderRepository.findOne({ where: { id } });
    if (!heroSlider) throw new NotFoundException('مقدار مورد نظر یافت نشد.');
    heroSlider.displayOrder = data.displayOrder;
    console.log(data);
    await this.heroSliderRepository.save(heroSlider);
    await this.cacheService.clearHeroSlidersCache();
    return {
      message: 'ترتیب با موفقیت انجام شد',
      data: null,
    }
  }
}
