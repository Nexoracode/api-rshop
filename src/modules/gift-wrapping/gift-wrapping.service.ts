import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftWrapping } from './entities/gift-wrapping.entity';
import { CreateGiftWrappingDto } from './dto/create-gift-wrapping.dto';
import { UpdateGiftWrappingDto } from './dto/update-gift-wrapping.dto';
import { GiftWrappingStatus } from './enums/gift-wrapping-status.enum';
import { FilterOperator, paginate, PaginateQuery } from 'nestjs-paginate';

@Injectable()
export class GiftWrappingService {
    constructor(
        @InjectRepository(GiftWrapping)
        private readonly giftWrappingRepo: Repository<GiftWrapping>,
    ) { }

    /**
     * ایجاد بسته‌بندی جدید (ادمین)
     */
    async create(dto: CreateGiftWrappingDto): Promise<GiftWrapping> {
        const lastAttrValue = await this.giftWrappingRepo.find({
            order: { displayOrder: 'DESC' },
            take: 1,
        })
        const nextOrder = lastAttrValue.length ? lastAttrValue[0].displayOrder + 1 : 1;
        const giftWrapping = this.giftWrappingRepo.create({
            name: dto.name,
            description: dto.description,
            price: dto.price,
            isActive: dto.isActive ?? true,
            imageId: dto.imageId,
            isForGift: dto.isForGift ?? true,
            displayOrder: nextOrder,

        });

        return await this.giftWrappingRepo.save(giftWrapping);
    }

    /**
     * دریافت تمام بسته‌بندی‌ها با Pagination (ادمین)
     */
    async findAll(query: PaginateQuery) {
        const gifts = await paginate(query, this.giftWrappingRepo, {
            sortableColumns: ['id', 'name', 'price', 'displayOrder', 'createdAt'],
            defaultSortBy: [['displayOrder', 'ASC']],
            searchableColumns: ['name', 'description'],
            filterableColumns: {
                isActive: [FilterOperator.EQ],
                isForGift: [FilterOperator.EQ],
            },
            relations: ['image'],
        });
        return {
            items: gifts.data,
            meta: gifts.meta,
            links: gifts.links,
        }
    }

    /**
     * دریافت بسته‌بندی‌های فعال (برای کاربران)
     */
    async findAllActive(): Promise<GiftWrapping[]> {
        return await this.giftWrappingRepo.find({
            where: { isActive: true },
            relations: ['image'],
            order: { displayOrder: 'ASC', name: 'ASC' },
        });
    }

    /**
     * دریافت یک بسته‌بندی
     */
    async findOne(id: number): Promise<GiftWrapping> {
        const giftWrapping = await this.giftWrappingRepo.findOne({
            where: { id },
            relations: ['image'],
        });

        if (!giftWrapping) {
            throw new NotFoundException(`بسته‌بندی با شناسه ${id} یافت نشد`);
        }

        return giftWrapping;
    }

    /**
     * بروزرسانی بسته‌بندی (ادمین)
     */
    async update(id: number, dto: UpdateGiftWrappingDto): Promise<GiftWrapping> {
        const giftWrapping = await this.findOne(id);

        Object.assign(giftWrapping, dto);

        return await this.giftWrappingRepo.save(giftWrapping);
    }

    /**
     * حذف بسته‌بندی (ادمین)
     */
    async remove(id: number): Promise<void> {
        const giftWrapping = await this.findOne(id);
        await this.giftWrappingRepo.remove(giftWrapping);
    }

    /**
     * تغییر وضعیت بسته‌بندی (ادمین)
     */
    async toggleStatus(id: number): Promise<GiftWrapping> {
        const giftWrapping = await this.findOne(id);

        giftWrapping.isActive = !giftWrapping.isActive;

        return await this.giftWrappingRepo.save(giftWrapping);
    }
}
