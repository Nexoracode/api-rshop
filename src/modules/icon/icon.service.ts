import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateIconDto } from './dto/create-icon.dto';
import { UpdateIconDto } from './dto/update-icon.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Icon } from './entities/icon.entity';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';

@Injectable()
export class IconService {
  constructor(
    @InjectRepository(Icon)
    private readonly iconRepo: Repository<Icon>
  ) { }

  async create(createIconDto: CreateIconDto) {
    const duplicateName = await this.iconRepo.findOne({ where: { name: createIconDto.name } })
    if (duplicateName) throw new BadRequestException('این نام آیکون از قبل ثبت شده است.');
    const newIcon = this.iconRepo.create(createIconDto);
    return await this.iconRepo.save(newIcon);
  }

  async findAll(query: PaginateQuery) {
    const result = await paginate(query, this.iconRepo, {
      sortableColumns: ['id', 'name', 'createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      searchableColumns: ['name'],
    })

    return {
      items: result.data,
      meta: result.meta,
      link: result.links,
    }
  }

  async findOne(id: number) {
    return await this.iconRepo.findOne({ where: { id } });
  }

  async update(id: number, updateIconDto: UpdateIconDto) {
    const icon = await this.iconRepo.findOne({ where: { id } });
    if (!icon) throw new BadRequestException('چنین آیکونی ای وجود ندارد.');
    const duplicateName = await this.iconRepo.findOne({ where: { name: updateIconDto.name } })
    if (duplicateName && duplicateName.id !== id) throw new BadRequestException('این نام آیکون از قبل ثبت شده است.');
    const updatedIcon = this.iconRepo.merge(icon, updateIconDto);
    return await this.iconRepo.save(updatedIcon);
  }

  async remove(id: number) {
    const icon = await this.iconRepo.findOne({ where: { id } });
    if (!icon) throw new BadRequestException('چنین آیکونی ای وجود ندارد.');
    await this.iconRepo.delete(id);
    return {
      message: 'ایکون با موفقیت حذف شد.',
      data: null,
    }
  }
}
