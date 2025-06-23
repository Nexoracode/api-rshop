import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attribute } from './entities/attribute.entity';
import { Repository } from 'typeorm';
import { IAttributeService } from './interfaces/attribute.service.interface';
import { IAttributeResponse } from './interfaces/attribute.response.interface';
import { AttributeGroup } from '../attribute-group/entities/attribute-group.entity';
import { AttributeMapper } from './mappers/attribute.mapper';

@Injectable()
export class AttributeService implements IAttributeService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepo: Repository<Attribute>,

    @InjectRepository(AttributeGroup)
    private readonly groupRepo: Repository<AttributeGroup>,
  ) { }
  async findAll(): Promise<IAttributeResponse[]> {
    const attributes = await this.attributeRepo.find({ relations: ['group'] });
    return attributes.map((attribute) => AttributeMapper.toResponse(attribute));
  }

  async create(data: CreateAttributeDto): Promise<IAttributeResponse> {
    const group = data.groupId ? await this.groupRepo.findOne({ where: { id: data.groupId } }) : null;
    const attribute = this.attributeRepo.create({
      name: data.name,
      isPublic: data.isPublic ?? false,
      group: group ?? undefined,
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
    Object.assign(attribute, data);
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
}
