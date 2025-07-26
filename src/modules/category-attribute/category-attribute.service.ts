import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryAttributeDto } from './dto/create-category-attribute.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryAttribute } from './entities/category-attribute.entity';
import { Repository } from 'typeorm';
import { ICategoryAttributeService } from './interfaces/category-attribute.service';
import { ICategoryAttributeResponse } from './interfaces/category-attribute.response.interface';
import { CategoryAttributeMapper } from './mappers/category-attribute.mapper';
import { Category } from '../category/entities/category.entity';
import { Attribute } from '../attributes/attribute/entities/attribute.entity';
import { UpdateCategoryAttribute } from './dto/update-category-attribute.dto';

@Injectable()
export class CategoryAttributeService implements ICategoryAttributeService {
  constructor(
    @InjectRepository(CategoryAttribute)
    private readonly repo: Repository<CategoryAttribute>,
  ) { }

  async assign(data: CreateCategoryAttributeDto): Promise<ICategoryAttributeResponse> {
    const existsCategoryAttr = await this.repo.findOne(
      { where: { categoryId: data.categoryId, attributeId: data.attributeId } }
    );
    if (existsCategoryAttr) throw new BadRequestException('دسته بندی به ویژگی اختصاص یافته است.');
    const categoryAttr = this.repo.create(data);
    await this.repo.save(categoryAttr);
    const returnCat = await this.repo.findOne({
      where: { categoryId: data.categoryId, attributeId: data.attributeId },
      relations: ['attribute', 'attribute.group', 'attribute.values', 'category'],
    })
    console.log('returnCat', returnCat);
    return CategoryAttributeMapper.toResponse(returnCat!);
  }

  async update(id: number, data: UpdateCategoryAttribute): Promise<ICategoryAttributeResponse> {
    const categoryAttr = await this.repo.findOne({ where: { id } });
    if (!categoryAttr) throw new NotFoundException('دسته ویژگی یافت نشد');
    const existsCategoryAttr = await this.repo.findOne(
      { where: { categoryId: data.categoryId, attributeId: data.attributeId } }
    );
    if (existsCategoryAttr) throw new BadRequestException('دسته بندی به ویژگی اختصاص یافته است.');
    const newCat = this.repo.merge(categoryAttr, data);
    const saved = await this.repo.save(newCat);
    return CategoryAttributeMapper.toResponse(saved);
  }

  async findByCategory(categoryId: number): Promise<ICategoryAttributeResponse> {
    const categoryAttrByCategory = await this.repo.findOne({ where: { categoryId }, relations: ['category', 'attribute', 'attribute.group', 'attribute.values'], });
    if (!categoryAttrByCategory) throw new NotFoundException('ویژگی ای برای این دسته یافت نشد.');
    return CategoryAttributeMapper.toResponse(categoryAttrByCategory);
  }
}
