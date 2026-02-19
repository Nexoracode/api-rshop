import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Not, Repository } from 'typeorm';
import { BaseService } from 'src/common/bases/base.service';
import { UserMapper } from './mappers/user.mapper';
import { IUserResponse } from './interfaces/user.response.interface';
import { IUserService } from './interfaces/user.service.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterOperator, paginate, PaginateQuery } from 'nestjs-paginate';
import { Role } from 'src/common/enums/role.enum';
import { RequestUser } from 'src/common/interfaces/request-user.interface';

@Injectable()
export class UserService extends BaseService<User> implements IUserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly dataSource: DataSource
    ) { super(userRepo) }

    async create(data: CreateUserDto): Promise<IUserResponse> {
        const existing = await this.userRepo.findOne({ where: { phone: data.phone } });
        if (existing) throw new BadRequestException('این شماره قبلا ثبت شده است.');

        const duplicateEmail = await this.userRepo.findOne({ where: { email: data.email } });
        if (data.email && duplicateEmail) throw new BadRequestException('این ایمیل از قبل ثبت شده است.');

        const addressEntities = data.addresses?.map((id) => ({ id })) ?? [];
        const user = this.userRepo.create({
            ...data,
            role: Role.USER, // ← همیشه USER
            addresses: addressEntities,
        });
        const saved = await this.userRepo.save(user);
        return UserMapper.toResponse(saved);
    }

    async update(id: number, data: UpdateUserDto): Promise<IUserResponse> {
        const user = await this.userRepo.findOne({ where: { id, role: Role.USER } });
        if (!user) throw new NotFoundException('کاربر یافت نشد.');

        const existsPhone = await this.userRepo.findOne({ where: { phone: data.phone } });
        if (existsPhone && existsPhone.id !== id) throw new BadRequestException('این شماره قبلا ثبت شده است');

        const existsEmail = await this.userRepo.findOne({ where: { email: data.email } });
        if (existsEmail && existsEmail.id !== id) throw new BadRequestException('این ایمیل از قبل ثبت شده است');

        const updated = this.userRepo.merge(user, { ...data, role: Role.USER }); // ← role قابل تغییر نیست
        const saved = await this.userRepo.save(updated);
        return UserMapper.toResponse(saved);
    }

    async updateMe(me: RequestUser, data: UpdateUserDto) {
        const user = await this.userRepo.findOne({ where: { id: me.id } });
        if (!user) throw new NotFoundException('کاربر یافت نشد.');

        if (data.phone) {
            const existPhone = await this.userRepo.findOne({ where: { phone: data.phone } });
            if (existPhone) throw new BadRequestException('این شماره موبایل قبلاً ثبت شده است.');
        }

        // بررسی تکراری نبودن ایمیل
        if (data.email) {
            const existEmail = await this.userRepo.findOne({ where: { email: data.email } });
            if (existEmail) throw new BadRequestException('این ایمیل قبلاً ثبت شده است.');
        }

        const updated = this.userRepo.merge(user, { ...data, role: me.role }); // ← role قابل تغییر نیست
        const saved = await this.userRepo.save(updated);
        return UserMapper.toResponse(saved);
    }

    async remove(id: number): Promise<Object> {
        const user = await this.userRepo.findOne({ where: { id, role: Role.USER } });
        if (!user) throw new NotFoundException('کاربر مورد نظر یافت نشد.');
        await this.userRepo.delete(id);
        return { message: 'کاربر با موفقیت حذف شد.', data: null };
    }

    async findOneUser(id: number): Promise<IUserResponse> {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['addresses'],
        });
        if (!user) throw new NotFoundException('کاربر یافت نشد.');
        return UserMapper.toResponse(user);
    }

    async findAllUser(query: PaginateQuery): Promise<Object> {
        const users = await paginate(query, this.userRepo, {
            where: { role: Role.USER }, // ← فقط کاربران عادی
            relations: ['addresses', 'media'],
            sortableColumns: ['id', 'firstName', 'lastName'],
            searchableColumns: ['firstName', 'lastName', 'phone', 'email'],
            defaultSortBy: [['id', 'DESC']],
            select: ['id', 'firstName', 'lastName', 'avatarUrl', 'phone', 'email', 'isPhoneVerified', 'isActive', 'createdAt', 'updatedAt', 'addresses.id', 'media.id', 'media.url'],
            filterableColumns: {
                isActive: [FilterOperator.EQ],
                createdAt: [FilterOperator.GTE, FilterOperator.LTE],
            },
        });
        return {
            message: 'لیست کاربران با موفقیت دریافت شد.',
            data: {
                items: users.data.map(user => UserMapper.toResponse(user)),
                meta: users.meta,
            },
        };
    }
}
