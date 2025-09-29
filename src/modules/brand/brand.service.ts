import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
  ) { }

  async create(createBrandDto: CreateBrandDto) {
    const existingBrand = await this.brandRepo.findOne({
      where: { name: createBrandDto.name },
    });
    if (existingBrand) throw new BadRequestException('برند با این نام وجود دارد');
    const brand = this.brandRepo.create(createBrandDto);
    const result = await this.brandRepo.save(brand);
    return {
      message: 'برند با موفقیت ایجاد شد',
      data: result,
    }
  }

  async findAllPaginate(query: PaginateQuery) {
    const result = await paginate(query, this.brandRepo, {
      sortableColumns: ['id', 'name', 'logo'],
      select: ['id', 'name', 'slug', 'logo'],
      defaultSortBy: [['id', 'DESC']],
      relations: [],
      searchableColumns: ['name'],
    });
    return {
      message: 'برندها با موفقیت دریافت شد',
      data: {
        items: result.data,
        meta: result.meta,
        links: result.links,
      },
    };
  }

  async findAll() {
    const brands = await this.brandRepo.find();
    return {
      message: 'برندها با موفقیت دریافت شد',
      data: brands,
    };
  }

  async findOne(id: number) {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) throw new BadRequestException('برند یافت نشد');
    return {
      message: 'برند با موفقیت دریافت شد',
      data: brand,
    };
  }

  async update(id: number, updateBrandDto: UpdateBrandDto) {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) throw new BadRequestException('برند یافت نشد');
    const existingBrand = await this.brandRepo.findOne({
      where: { name: updateBrandDto.name },
    });
    if (existingBrand && existingBrand.id !== id) {
      throw new BadRequestException('برند با این نام وجود دارد');
    }
    const updatedBrand = this.brandRepo.merge(brand, updateBrandDto);
    const result = await this.brandRepo.save(updatedBrand);
    return {
      message: 'برند با موفقیت به‌ روزرسانی شد',
      data: result,
    };
  }

  async remove(id: number) {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) throw new BadRequestException('برند یافت نشد');
    await this.brandRepo.delete(id);
    return {
      message: 'برند با موفقیت حذف شد',
      data: null,
    };
  }
}
