import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { PromoBanner } from './entities/promo-banner.entity';
import { CreatePromoBannerDto, UpdatePromoBannerDto } from './dto/promo-banner.dto';

@Injectable()
export class PromoBannerService {
    private readonly logger = new Logger(PromoBannerService.name);

    constructor(
        @InjectRepository(PromoBanner)
        private readonly promoBannerRepo: Repository<PromoBanner>,
        // private readonly cacheService: PromoBannerCacheService,
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

        // پاک کردن کش
        this.clearCache();

        return saved;
    }

    /**
     * دریافت بنر فعال برای نمایش (Public)
     * فقط یک بنر با بالاترین اولویت
     */
    async getActiveBanner(): Promise<PromoBanner | null> {
        const cacheKey = 'promo-banner:active';

        // چک کش
        // const cached = this.cacheService.get<PromoBanner | null>(cacheKey);
        // if (cached !== null && cached !== undefined) {
        //   this.logger.debug('✅ Returning cached active banner');
        //   return cached;
        // }

        const now = new Date();

        const banner = await this.promoBannerRepo
            .createQueryBuilder('banner')
            .where('banner.isActive = :isActive', { isActive: true })
            .andWhere(
                '(banner.startDate IS NULL OR banner.startDate <= :now)',
                { now },
            )
            .andWhere(
                '(banner.endDate IS NULL OR banner.endDate >= :now)',
                { now },
            )
            .orderBy('banner.priority', 'DESC')
            .addOrderBy('banner.createdAt', 'DESC')
            .getOne();

        // ذخیره در کش (حتی اگر null باشد)
        // this.cacheService.set(cacheKey, banner);

        return banner;
    }

    /**
     * لیست تمام بنرها (Admin)
     */
    async findAll(): Promise<PromoBanner[]> {
        const cacheKey = 'promo-banner:all';

        // const cached = this.cacheService.get<PromoBanner[]>(cacheKey);
        // if (cached) {
        //   this.logger.debug('✅ Returning cached all banners');
        //   return cached;
        // }

        const banners = await this.promoBannerRepo.find({
            order: {
                priority: 'DESC',
                createdAt: 'DESC',
            },
        });

        // this.cacheService.set(cacheKey, banners);

        return banners;
    }

    /**
     * جزئیات یک بنر (Admin)
     */
    async findOne(id: number): Promise<PromoBanner> {
        const banner = await this.promoBannerRepo.findOne({
            where: { id },
        });

        if (!banner) {
            throw new NotFoundException('بنر تبلیغاتی یافت نشد');
        }

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

        // پاک کردن کش
        this.clearCache();

        return updated;
    }

    /**
     * حذف بنر
     */
    async remove(id: number): Promise<void> {
        const banner = await this.findOne(id);
        await this.promoBannerRepo.remove(banner);

        // پاک کردن کش
        this.clearCache();
    }

    /**
     * فعال/غیرفعال کردن بنر
     */
    async toggleActive(id: number): Promise<PromoBanner> {
        const banner = await this.findOne(id);
        banner.isActive = !banner.isActive;

        const updated = await this.promoBannerRepo.save(banner);

        // پاک کردن کش
        this.clearCache();

        return updated;
    }

    /**
     * پاک کردن کش
     */
    clearCache(): void {
        // this.cacheService.clear();
        this.logger.log('🗑️  PromoBanner cache cleared');
    }
}