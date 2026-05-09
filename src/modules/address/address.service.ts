import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IAddressService } from './interfaces/address.service.interface';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { IAddressResponse } from './interfaces/address.response.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Not, Repository } from 'typeorm';
import { AddressMapper } from './mappers/address.mapper';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AddressService implements IAddressService {
    constructor(
        @InjectRepository(Address)
        private readonly addressRepo: Repository<Address>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>
    ) { }

    async create(userId: number, data: CreateAddressDto): Promise<IAddressResponse> {
        const user = await this.userRepo.findOne({ where: { id: userId } })
        if (!user) throw new NotFoundException('کاربری با این شناسه یافت نشد.');
        const exists = await this.addressRepo.findOne({
            where: { postalCode: data.postalCode },
            relations: ['user']
        })
        if (exists) throw new BadRequestException('postal code already exists');
        await this.addressRepo.update(
            { user: { id: user.id } },
            { isPrimary: false }
        )
        const address = this.addressRepo.create({
            ...data,
            user,
        });
        const saved = await this.addressRepo.save(address);
        return AddressMapper.toResponse(saved);
    }

    async findMe(userId: number): Promise<IAddressResponse> {
        const address = await this.addressRepo.findOne({
            where: {
                isActive: true,
                deletedAt: new Date(),
                user: { id: userId },
                isPrimary: true,
            },
            relations: ['user'],
        })
        if (!address) {
            throw new NotFoundException('address not found');
        }
        return AddressMapper.toResponse(address);
    }

    async update(id: number, data: UpdateAddressDto): Promise<IAddressResponse> {
        const address = await this.addressRepo.findOne({
            relations: ['user'],
            where: { id },
        })
        if (!address) {
            throw new NotFoundException('address not found');
        }
        if (data.isPrimary === true) {
            await this.addressRepo.update(
                { user: { id: address.user.id } },
                { isPrimary: false }
            )
        }
        const updated = this.addressRepo.merge(address, data);
        const saved = await this.addressRepo.save(updated);
        return AddressMapper.toResponse(saved);
    }

    async remove(userId: number, id: number): Promise<Object> {
        // 1️⃣ پیدا کردن آدرس مورد نظر برای حذف
        const addressToDelete = await this.addressRepo.findOne({
            where: { id, userId },
        });

        if (!addressToDelete) {
            throw new BadRequestException('آدرس یافت نشد');
        }

        // 2️⃣ چک کن آیا این آدرس اصلی بود؟
        const wasPrimary = addressToDelete.isPrimary === true;

        // 3️⃣ حذف منطقی آدرس
        await this.addressRepo.update(
            { id, userId },
            { deletedAt: new Date(), isActive: false, isPrimary: false }
        );

        // 4️⃣ اگر آدرس حذف شده اصلی بود، یک آدرس جدید رو اصلی کن
        if (wasPrimary) {
            // پیدا کردن جدیدترین آدرس فعال دیگه (غیر از آدرسی که حذف شده)
            const anotherActiveAddress = await this.addressRepo.findOne({
                where: {
                    userId,
                    isActive: true,
                    id: Not(id)  // آدرس حذف شده رو исключи
                },
                order: { createdAt: 'DESC' },  // جدیدترین آدرس
            });

            // اگر آدرس دیگه‌ای وجود داره، اون رو اصلی کن
            if (anotherActiveAddress) {
                await this.addressRepo.update(
                    { id: anotherActiveAddress.id },
                    { isPrimary: true }
                );
            }
        }

        return { message: 'آدرس با موفقیت حذف شد', data: null };
    }

    async findByUserId(userId: number): Promise<IAddressResponse[]> {
        const user = await this.userRepo.findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new NotFoundException('user not found');
        }
        const address = await this.addressRepo.find({
            where: { user: { id: userId }, isActive: true },
        })
        return address.map((a) => AddressMapper.toResponse(a))
    }

}
