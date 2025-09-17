import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attribute } from './entities/attribute.entity';
import { Repository } from 'typeorm';
import { IAttributeService } from './interfaces/attribute.service.interface';
import { IAttributeResponse, IAttributeResponseGrouped } from './interfaces/attribute.response.interface';
import { AttributeGroup } from '../attribute-group/entities/attribute-group.entity';
import { AttributeMapper } from './mappers/attribute.mapper';
import { AttributeUnit } from 'src/common/enums/attribute.enum';
import { AttributeGroupMapper } from '../attribute-group/mappers/attribute-group.mapper';

@Injectable()
export class AttributeService implements IAttributeService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepo: Repository<Attribute>,
    @InjectRepository(AttributeGroup)
    private readonly groupRepo: Repository<AttributeGroup>,

  ) { }

  async findById(id: number): Promise<IAttributeResponse> {
    const attribute = await this.attributeRepo.findOne({
      where: { id }, relations: ['group'], order: {
        displayOrder: 'ASC'
      }
    },);
    if (!attribute) throw new NotFoundException('ویژگی مورد نظر یافت نشد');
    return AttributeMapper.toResponseGrouped(attribute);
  }

  async findAll(grouped: boolean): Promise<IAttributeResponse[] | IAttributeResponseGrouped[]> {
    const attributes = await this.attributeRepo.find({
      relations: ['group'], order: {
        displayOrder: 'ASC'
      }
    });
    if (grouped) {
      return attributes.map((attribute) => AttributeMapper.toResponseGrouped(attribute));
    }
    return attributes.map((attribute) => AttributeMapper.toResponse(attribute));
  }

  async findByGroup(groupId: number): Promise<IAttributeResponseGrouped[]> {
    const attributeGroups = await this.attributeRepo.find(
      { where: { groupId }, relations: ['group'], order: { displayOrder: 'ASC' } }
    );
    if (!attributeGroups || attributeGroups.length === 0) throw new NotFoundException('گروهی برای این ویژگی یافت نشد');
    return attributeGroups.map((attr) => AttributeMapper.toResponseGrouped(attr));
  }

  async create(data: CreateAttributeDto): Promise<IAttributeResponse> {
    const group = data.groupId ? await this.groupRepo.findOne({ where: { id: data.groupId } }) : null;
    const duplicateAttribute = await this.attributeRepo.findOne({ where: { slug: data.slug } });
    const duplicateAttributeByName = await this.attributeRepo.findOne({ where: { name: data.name } });
    if (duplicateAttribute || duplicateAttributeByName) throw new NotFoundException('ویژگی با این نام یا اسلاگ وجود دارد');
    const lastAttribute = await this.attributeRepo.find({
      order: { displayOrder: 'DESC' },
      take: 1,
    })
    const nextOrder = lastAttribute.length ? lastAttribute[0].displayOrder + 1 : 1;
    const attribute = this.attributeRepo.create({
      ...data,
      group: group ?? undefined,
      displayOrder: nextOrder
    })
    const saved = await this.attributeRepo.save(attribute);
    return AttributeMapper.toResponse(saved);
  }

  async update(id: number, data: UpdateAttributeDto): Promise<IAttributeResponse> {
    const attribute = await this.attributeRepo.findOne({ where: { id }, relations: ['group'] });
    if (!attribute) throw new NotFoundException('ویژگی مورد نظر یافت نشد');
    if (data.groupId) {
      const group = await this.groupRepo.findOne({ where: { id: data.groupId } });
      if (!group) throw new NotFoundException('گروه یافت نشد');
      attribute.group = group;
    }
    Object.assign(attribute, {
      name: data.name,
      slug: data.slug,
      isPublic: data.isPublic ?? false,
      type: data.type,
      displayOrder: attribute.displayOrder,
    });
    const saved = await this.attributeRepo.save(attribute);
    return AttributeMapper.toResponse(saved);
  }
  async remove(id: number): Promise<Object> {
    const deletedAttribute = await this.attributeRepo.delete(id);
    if (deletedAttribute.affected === 0) {
      throw new NotFoundException('ویژگی مورد نظر یافت نشد');
    }
    return {
      message: 'حذف با موفقیت انجام شد.',
      data: null,
    }
  }

  async updateOrder(id: number, order: number): Promise<Object> {
    const value = await this.attributeRepo.findOne({ where: { id } });
    if (!value) throw new NotFoundException('مقدار ویژگی مورد نظر یافت نشد.');
    value.displayOrder = order;
    await this.attributeRepo.save(value);
    return {
      message: 'ترتیب با موفقیت انجام شد',
      data: null,
    }

  }

}
