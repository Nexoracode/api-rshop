import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttributeGroupDto } from './dto/create-attribute-group.dto';
import { UpdateAttributeGroupDto } from './dto/update-attribute-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AttributeGroup } from './entities/attribute-group.entity';
import { Repository } from 'typeorm';
import { CategoryService } from 'src/modules/category/category.service';

@Injectable()
export class AttributeGroupService {
  constructor(
    @InjectRepository(AttributeGroup)
    private readonly repo: Repository<AttributeGroup>,
    private readonly categoryService: CategoryService,
  ) { }

  async create(dto: CreateAttributeGroupDto) {
    const category = await this.categoryService.findOne(dto.categoryId);
    let group = await this.repo.findOneBy({ name: dto.name });
    if (group) {
      throw new Error(`Attribute group with name ${dto.name} already exists.`);
    }
    group = this.repo.create({
      name: dto.name,
    });
    return await this.repo.save(group);
  }

  async findAll() {
    return await this.repo.find();
  }

  async findOne(id: number) {
    const group = await this.repo.findOne({
      where: { id },
      relations: ['attributes'],
    });
    if (!group) {
      throw new Error(`Attribute group with id ${id} not found.`);
    }
    const { id: groupId, ...result } = group;
    return result;
  }

  async update(id: number, updateAttributeGroupDto: UpdateAttributeGroupDto) {
    const group = await this.repo.findOneBy({ id });
    if (!group) {
      throw new NotFoundException(`Attribute group with id ${id} not found.`);
    }
    const updatedGroup = Object.assign(group, updateAttributeGroupDto);
    return await this.repo.save(updatedGroup);
  }

  async remove(id: number) {
    const group = await this.repo.findOneBy({ id });
    if (!group) {
      throw new NotFoundException(`Attribute group with id ${id} not found.`);
    }
    return await this.repo.remove(group);
  }
}
