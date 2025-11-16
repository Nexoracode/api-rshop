import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IAddressService } from './interfaces/address.service.interface';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { IAddressResponse } from './interfaces/address.response.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Repository } from 'typeorm';
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

    async remove(id: number): Promise<Object> {
        const exists = await this.addressRepo.findOne({
            where: { id },
        })
        if (!exists) throw new BadRequestException('آدرس یافت نشد');
        await this.addressRepo.delete(id);
        return { message: 'آدرس با موفقیت حذف شد', data: null };
    }

    async findByUserId(userId: number): Promise<IAddressResponse[]> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('user not found');
        }
        const address = await this.addressRepo.find({
            where: { user: { id: userId } },
        })
        return address.map((a) => AddressMapper.toResponse(a))
    }

}
