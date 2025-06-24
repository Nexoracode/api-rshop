import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryAttributeDto } from './dto/create-category-attribute.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryAttribute } from './entities/category-attribute.entity';
import { Repository } from 'typeorm';
import { ICategoryAttributeService } from './interfaces/category-attibute.service.interface';
import { ICategoryAttributeResponse } from './interfaces/category-attribute.response.interface';
import { CategoryAttributeMapper } from './mappers/category-attribute.mapper';

@Injectable()
export class CategoryAttributeService implements ICategoryAttributeService {
  constructor(
    @InjectRepository(CategoryAttribute)
    private readonly repo: Repository<CategoryAttribute>
  ) { }

  async assign(data: CreateCategoryAttributeDto): Promise<ICategoryAttributeResponse> {
    const existsCategoryAttr = await this.repo.findOne(
      { where: { categoryId: data.categoryId, attributeId: data.attributeId } }
    );
    if (existsCategoryAttr) throw new BadRequestException('دسته بندی به ویژگی اختصاص یافته است.');
    const categoryAttr = this.repo.create(data);
    const saved = await this.repo.save(categoryAttr);
    const returnCat = await this.repo.findOne({
      where: { categoryId: data.categoryId, attributeId: data.attributeId },
      relations: ['attribute', 'attribute.group', 'category'],
    })
    return CategoryAttributeMapper.toResponse(returnCat!);
  }
  async findByAttribute(attributeId: number): Promise<ICategoryAttributeResponse[]> {
    throw new Error('Method not implemented.');
  }
  async findByCategory(categoryId: number): Promise<ICategoryAttributeResponse[]> {
    throw new Error('Method not implemented.');
  }


}
