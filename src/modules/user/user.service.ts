import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { BaseService } from 'src/common/bases/base.service';
import { UserMapper } from './mappers/user.mapper';
import { IUserResponse } from './interfaces/user.response.interface';
import { IUserService } from './interfaces/user.service.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterOperator, paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { Request } from 'express';

@Injectable()
export class UserService extends BaseService<User> implements IUserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { super(userRepo) }

    async create(data: CreateUserDto): Promise<IUserResponse> {
        const existing = await this.userRepo.findOne({ where: { phone: data.phone } })
        if (existing) {
            throw new BadRequestException('این شماره قبلا ثبت شده است.');
        }
        const duplicateEmail = await this.userRepo.findOne({ where: { email: data.email } });
        if (duplicateEmail) throw new BadRequestException('این ایمیل از قبل ثبت شده است.');
        const addressEntities = data.addresses?.map((id) => ({ id })) ?? [];
        const user = this.userRepo.create({
            ...data,
            addresses: addressEntities,
        });
        const saved = await this.userRepo.save(user);
        return UserMapper.toResponse(saved);
    }

    async update(id: number, data: UpdateUserDto): Promise<IUserResponse> {
        const user = await this.userRepo.findOne({ where: { id } })
        if (!user) {
            throw new NotFoundException('users not found');
        }
        const addressEntities = data.addresses?.map((id) => ({ id })) ?? [];
        const existsPhone = await this.userRepo.findOne({ where: { phone: data.phone } });
        if (existsPhone && existsPhone.id !== id) throw new BadRequestException('این شماره قبلا ثبت شده است');
        const existsEmail = await this.userRepo.findOne({ where: { email: data.email } });
        if (existsEmail && existsEmail.id !== id) throw new BadRequestException('این ایمیل از قبل ثبت شده است');
        const updated = this.userRepo.merge(user, {
            ...data,
            addresses: addressEntities,
        });
        const saved = await this.userRepo.save(updated);
        return UserMapper.toResponse(saved);
    }

    async remove(id: number): Promise<Object> {
        const user = await this.userRepo.delete(id);
        if (user.affected === 0) {
            throw new NotFoundException('کاربر مورد نظر یافت نشد.');
        }
        return { message: 'کاربر با موفقیت حذف شد.', data: null };
    }

    async findOneUser(id: number): Promise<IUserResponse> {
        return this.findOneWithMapper(id, ['addresses'], UserMapper.toResponse);
    }


    async findAllUser(query: PaginateQuery): Promise<Object> {
        const users = await paginate(query, this.userRepo, {
            relations: ['addresses', 'media'],
            sortableColumns: ['id', 'firstName', 'lastName'],
            searchableColumns: ['firstName', 'lastName', 'phone', 'email'],
            defaultSortBy: [['id', 'DESC']],
            select: ['id', 'firstName', 'lastName', 'avatarUrl', 'phone', 'email', 'isPhoneVerified', 'isActive', 'createdAt', 'updatedAt', 'addresses.id', 'media.id', 'media.url'],
            filterableColumns: {
                isActive: [FilterOperator.EQ],
                createdAt: [FilterOperator.GTE, FilterOperator.LTE]
            }
        });
        return {
            message: 'لیست کاربران با موفقیت دریافت شد.',
            data: {
                items: users.data.map(user => UserMapper.toResponse(user)),
                meta: users.meta,
            }
        }
    }
}
