import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HeroSlider } from './entities/hero-slider.entity';
import { CreateHeroSliderDto, UpdateHeroSliderDto } from './dto/hero-slider.dto';
import { HomePageCacheService } from './cache/home-page-cache.service'; // ✅ اضافه شد

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
    const slider = this.heroSliderRepository.create(createDto);
    const result = await this.heroSliderRepository.save(slider);

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
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
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
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
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

    // ✅ پاک کردن cache
    await this.cacheService.clearHeroSlidersCache(id);
    this.logger.log(`🗑️ Hero slider ${id} cache پاک شد بعد از delete`);
  }

  async updateSortOrder(updates: { id: number; sort_order: number }[]): Promise<void> {
    // لاجیک اصلی (بدون تغییر)
    for (const update of updates) {
      await this.heroSliderRepository.update(update.id, {
        sortOrder: update.sort_order,
      });
    }

    // ✅ پاک کردن cache (چون ترتیب عوض شده)
    await this.cacheService.clearHeroSlidersCache();
    this.logger.log('🗑️ Hero sliders cache پاک شد بعد از sort order update');
  }
}
