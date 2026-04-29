import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, MoreThan } from 'typeorm';
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
            startDate: dto.startDate ? new Date(dto.startDate) : null,
            endDate: dto.endDate ? new Date(dto.endDate) : null,
            displayDuration: dto.displayDuration || null,
            description: dto.description || null,
        });

        const lastAttribute = await this.promoBannerRepo.find({
            order: { displayOrder: 'DESC' },
            take: 1,
        })

        const nextOrder = lastAttribute.length ? lastAttribute[0].displayOrder + 1 : 1;
        const saved = await this.promoBannerRepo.save({
            ...banner,
            displayOrder: nextOrder,
        });
        // ✅ پاک کردن cache
        await this.cacheService.clearPromoBannersCache();
        this.logger.log('🗑️ promo banner cache پاک شد بعد از create');

        return saved;
    }


    /**
     * لیست تمام بنرها (Admin)
     */
    async findAll() {
        // const cached = await this.cacheService.getAllPromoBanner();
        // if (cached) {
        //     this.logger.log('✅ All promo banner از cache');
        //     return cached;
        // }
        const banners = await this.promoBannerRepo.find({
            order: {
                displayOrder: 'DESC',
                createdAt: 'DESC',
            },
        });
        const newBanners = banners.map(promo => ({
            id: promo.id,
            title: promo.title,
            backgroundColor: promo.backgroundColor,
            textColor: promo.textColor,
            link: promo.link,
            linkText: promo.linkText,
            imageUrl: promo.imageUrl,
            isActive: promo.isActive,
            isClosable: promo.isClosable,
            displayOrder: promo.displayOrder,
            startDate: promo.startDate,
            endDate: promo.endDate,
            displayDuration: promo.displayDuration,
            description: promo.description,
        }));
        // ✅ ذخیره در cache
        await this.cacheService.setAllPromoBanner(newBanners);
        this.logger.log('💾 All promo banner ذخیره شد در cache');
        return newBanners;
    }

    /**
     * دریافت بنر فعال برای نمایش (Public)
     * فقط یک بنر با بالاترین اولویت
     */
    async findAllActive() {
        const cached = await this.cacheService.getAllPromoBanner();
        if (cached) {
            this.logger.log('✅ All promo banner از cache');
            return cached;
        }
        const now = new Date();
        const banners = await this.promoBannerRepo.find({
            where: {
                isActive: true,
                startDate: LessThanOrEqual(now),
                endDate: MoreThanOrEqual(now),
            },
            order: {
                displayOrder: 'DESC',
                createdAt: 'DESC',
            }
        });

        const newBanners = banners.map(promo => ({
            id: promo.id,
            title: promo.title,
            backgroundColor: promo.backgroundColor,
            textColor: promo.textColor,
            link: promo.link,
            linkText: promo.linkText,
            imageUrl: promo.imageUrl,
            isActive: promo.isActive,
            isClosable: promo.isClosable,
            displayOrder: promo.displayOrder,
            startDate: promo.startDate,
            endDate: promo.endDate,
            displayDuration: promo.displayDuration,
            description: promo.description,
        }));

        this.logger.log('💾 Active promo banner ذخیره شد در cache');

        return newBanners
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
        const deletedOrder = banner.displayOrder;

        // حذف بنر
        await this.promoBannerRepo.remove(banner);

        // دریافت بنرهایی که ترتیب بالاتری دارند
        const remainingBanners = await this.promoBannerRepo.find({
            where: { displayOrder: MoreThan(deletedOrder) },
            order: { displayOrder: 'ASC' }
        });

        // به‌روزرسانی ترتیب آنها
        for (const item of remainingBanners) {
            item.displayOrder -= 1;
            await this.promoBannerRepo.save(item);
        }

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

    async updateSortOrder(id: number, data: { displayOrder: number }) {
        const promo = await this.promoBannerRepo.findOne({ where: { id } });
        if (!promo) throw new NotFoundException('مقدار مورد نظر یافت نشد.');
        promo.displayOrder = data.displayOrder;
        await this.promoBannerRepo.save(promo);
        await this.cacheService.clearPromoBannersCache(id);
        return {
            message: 'ترتیب با موفقیت انجام شد',
            data: null,
        }
    }
}