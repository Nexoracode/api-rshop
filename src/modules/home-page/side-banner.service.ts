import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SideBanner, BannerPosition } from './entities/side-banner.entity';
import { CreateSideBannerDto, UpdateSideBannerDto } from './dto/side-banner.dto';
import { HomePageCacheService } from './cache/home-page-cache.service'; // ✅ اضافه شد

@Injectable()
export class SideBannerService {
  private readonly logger = new Logger(SideBannerService.name); // ✅ اضافه شد

  constructor(
    @InjectRepository(SideBanner)
    private sideBannerRepository: Repository<SideBanner>,
    private readonly cacheService: HomePageCacheService, // ✅ اضافه شد
  ) { }

  async create(createDto: CreateSideBannerDto): Promise<SideBanner> {
    // لاجیک اصلی (بدون تغییر)
    const banner = this.sideBannerRepository.create(createDto);
    const result = await this.sideBannerRepository.save(banner);

    // ✅ پاک کردن cache
    await this.cacheService.clearSideBannersCache();
    this.logger.log('🗑️ Side banners cache پاک شد بعد از create');

    return result;
  }

  async findAll(): Promise<SideBanner[]> {
    // ✅ چک cache
    const cached = await this.cacheService.getAllSideBanners();
    if (cached) {
      this.logger.log('✅ All side banners از cache');
      return cached;
    }

    // لاجیک اصلی (بدون تغییر)
    const result = await this.sideBannerRepository.find({
      order: { position: 'ASC', sortOrder: 'ASC' },
    });

    // ✅ ذخیره در cache
    await this.cacheService.setAllSideBanners(result);
    this.logger.log('💾 All side banners ذخیره شد در cache');

    return result;
  }

  async findAllActive(isActive: boolean): Promise<SideBanner[]> {
    // ✅ چک cache
    const cached = await this.cacheService.getActiveSideBanners();
    if (cached) {
      this.logger.log('✅ Active side banners از cache');
      return cached;
    }

    // لاجیک اصلی (بدون تغییر)
    const result = await this.sideBannerRepository.find({
      where: { isActive: isActive ? undefined : true, },
      order: { position: 'ASC', sortOrder: 'ASC' },
    });

    // ✅ ذخیره در cache
    await this.cacheService.setActiveSideBanners(result);
    this.logger.log('💾 Active side banners ذخیره شد در cache');

    return result;
  }

  async findByPosition(position: BannerPosition): Promise<SideBanner[]> {
    // لاجیک اصلی (بدون تغییر - position cache نداریم)
    return await this.sideBannerRepository.find({
      where: { position, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: number): Promise<SideBanner> {
    // ✅ چک cache
    const cached = await this.cacheService.getSideBannerById(id);
    if (cached) {
      this.logger.log(`✅ Side banner ${id} از cache`);
      return cached;
    }

    // لاجیک اصلی (بدون تغییر)
    const banner = await this.sideBannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Side banner with ID ${id} not found`);
    }

    // ✅ ذخیره در cache
    await this.cacheService.setSideBannerById(id, banner);
    this.logger.log(`💾 Side banner ${id} ذخیره شد در cache`);

    return banner;
  }

  async update(id: number, updateDto: UpdateSideBannerDto): Promise<SideBanner> {
    // لاجیک اصلی (بدون تغییر)
    const banner = await this.findOne(id);
    Object.assign(banner, updateDto);
    const result = await this.sideBannerRepository.save(banner);

    // ✅ پاک کردن cache
    await this.cacheService.clearSideBannersCache(id);
    this.logger.log(`🗑️ Side banner ${id} cache پاک شد بعد از update`);

    return result;
  }

  async remove(id: number): Promise<void> {
    // لاجیک اصلی (بدون تغییر)
    const banner = await this.findOne(id);
    await this.sideBannerRepository.remove(banner);

    // ✅ پاک کردن cache
    await this.cacheService.clearSideBannersCache(id);
    this.logger.log(`🗑️ Side banner ${id} cache پاک شد بعد از delete`);
  }
}
