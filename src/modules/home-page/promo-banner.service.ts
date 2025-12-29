import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { PromoBanner } from './entities/promo-banner.entity';
import { CreatePromoBannerDto, UpdatePromoBannerDto } from './dto/promo-banner.dto';
import { HomePageCacheService } from './cache';

@Injectable()
export class PromoBannerService {
    private readonly logger = new Logger(PromoBannerService.name);

    constructor(
        @InjectRepository(PromoBanner)
        private readonly promoBannerRepo: Repository<PromoBanner>,
        private readonly cacheService: HomePageCacheService,
    ) { }

    /**
     * ساخت بنر تبلیغاتی جدید
     */
    async create(dto: CreatePromoBannerDto): Promise<PromoBanner> {
        const banner = this.promoBannerRepo.create({
            title: dto.title,
            imageUrl: dto.imageUrl,
            link: dto.link || null,
            linkText: dto.linkText || null,
            backgroundColor: dto.backgroundColor || null,
            textColor: dto.textColor || null,
            isActive: dto.isActive ?? true,
            isClosable: dto.isClosable ?? true,
            priority: dto.priority ?? 0,
            startDate: dto.startDate ? new Date(dto.startDate) : null,
            endDate: dto.endDate ? new Date(dto.endDate) : null,
            displayDuration: dto.displayDuration || null,
            description: dto.description || null,
        });

        const saved = await this.promoBannerRepo.save(banner);
        // ✅ پاک کردن cache
        await this.cacheService.clearPromoBannersCache();
        this.logger.log('🗑️ Hero promo banner cache پاک شد بعد از create');

        return saved;
    }


    /**
     * لیست تمام بنرها (Admin)
     */
    async findAll(): Promise<PromoBanner[]> {
        const cached = await this.cacheService.getAllPromoBanner();
        if (cached) {
            this.logger.log('✅ All promo banner از cache');
            return cached;
        }
        const banners = await this.promoBannerRepo.find({
            order: {
                priority: 'DESC',
                createdAt: 'DESC',
            },
        });
        // ✅ ذخیره در cache
        await this.cacheService.setAllHeroSliders(banners);
        this.logger.log('💾 All promo banner ذخیره شد در cache');
        return banners;
    }

    /**
     * دریافت بنر فعال برای نمایش (Public)
     * فقط یک بنر با بالاترین اولویت
     */
    async findAllActive(isActive: boolean): Promise<PromoBanner[]> {
        const cached = await this.cacheService.getActiveHeroSliders();
        if (cached) {
            this.logger.log('✅ Active promo banner از cache');
            return cached;
        }
        const now = new Date();
        const banners = await this.promoBannerRepo.find({
            where: isActive ? {
                isActive: true,
                startDate: LessThanOrEqual(now),
                endDate: MoreThanOrEqual(now),
            } : undefined,
            order: {
                priority: 'DESC',
                createdAt: 'DESC',
            }
        });

        await this.cacheService.setActivePromoBanner(banners);
        this.logger.log('💾 Active promo banner ذخیره شد در cache');

        return banners;
    }

    /**
     * جزئیات یک بنر (Admin)
     */
    async findOne(id: number): Promise<PromoBanner> {
        // ✅ چک cache
        const cached = await this.cacheService.getPromoBannerById(id);
        if (cached) {
            this.logger.log(`✅ promo banner ${id} از cache`);
            return cached;
        }
        const banner = await this.promoBannerRepo.findOne({
            where: { id },
        });

        if (!banner) {
            throw new NotFoundException('بنر تبلیغاتی یافت نشد');
        }
        // ✅ ذخیره در cache
        await this.cacheService.setPromoBannerById(id, banner);
        this.logger.log(`💾 promo banner ${id} ذخیره شد در cache`);

        return banner;
    }

    /**
     * بروزرسانی بنر
     */
    async update(id: number, dto: UpdatePromoBannerDto): Promise<PromoBanner> {
        const banner = await this.findOne(id);

        Object.assign(banner, {
            title: dto.title ?? banner.title,
            imageUrl: dto.imageUrl ?? banner.imageUrl,
            link: dto.link ?? banner.link,
            linkText: dto.linkText ?? banner.linkText,
            backgroundColor: dto.backgroundColor ?? banner.backgroundColor,
            textColor: dto.textColor ?? banner.textColor,
            isActive: dto.isActive ?? banner.isActive,
            isClosable: dto.isClosable ?? banner.isClosable,
            priority: dto.priority ?? banner.priority,
            startDate: dto.startDate ? new Date(dto.startDate) : banner.startDate,
            endDate: dto.endDate ? new Date(dto.endDate) : banner.endDate,
            displayDuration: dto.displayDuration ?? banner.displayDuration,
            description: dto.description ?? banner.description,
        });

        const updated = await this.promoBannerRepo.save(banner);

        // ✅ پاک کردن cache
        await this.cacheService.clearPromoBannersCache(id);
        this.logger.log(`🗑️ promo banner ${id} cache پاک شد بعد از update`);


        return updated;
    }

    /**
     * حذف بنر
     */
    async remove(id: number): Promise<void> {
        const banner = await this.findOne(id);
        await this.promoBannerRepo.remove(banner);
        await this.cacheService.clearPromoBannersCache(id);
        this.logger.log(`🗑️ promo banner ${id} cache پاک شد بعد از delete`);
    }

    /**
     * فعال/غیرفعال کردن بنر
     */
    async toggleActive(id: number): Promise<PromoBanner> {
        const banner = await this.findOne(id);
        banner.isActive = !banner.isActive;
        const updated = await this.promoBannerRepo.save(banner);
        await this.cacheService.clearPromoBannersCache(id);
        this.logger.log(`🗑️ promo banner ${id} cache پاک شد بعد از toggle active`);
        return updated;
    }
}