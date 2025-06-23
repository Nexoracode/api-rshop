import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AttributeValue } from './entities/attribute-value.entity';
import { In, Repository } from 'typeorm';
import { IAttributeValueService } from './interfaces/attribute-value.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { IAttributeValueResponse } from './interfaces/attribute-value.response.interface';
import { Attribute } from '../attribute/entities/attribute.entity';
import { AttributeValueMapper } from './mappers/attribute-value.mapper';
import { AttributeMapper } from '../attribute/mappers/attribute.mapper';

@Injectable()
export class AttributeValueService implements IAttributeValueService {
  constructor(
    @InjectRepository(AttributeValue)
    private readonly valueRepo: Repository<AttributeValue>,
    @InjectRepository(Attribute)
    private readonly attrRepo: Repository<Attribute>
  ) { }

  async findByAttribute(attributeId: number): Promise<IAttributeValueResponse[]> {
    const values = await this.valueRepo.find({ where: { attributeId } })
    return values.map((value) => AttributeValueMapper.toResponse(value));
  }

  async create(data: CreateAttributeValueDto): Promise<IAttributeValueResponse> {
    const attr = await this.attrRepo.findOne({ where: { id: data.attributeId } });
    if (!attr) throw new NotFoundException('ویژگی یافت نشد');
    const value = this.valueRepo.create(data);
    const saved = await this.valueRepo.save(value);
    return AttributeValueMapper.toResponse(saved);
  }

  async update(id: number, data: UpdateAttributeValueDto): Promise<IAttributeValueResponse> {
    const value = await this.valueRepo.findOne({ where: { id } });
    if (!value) throw new NotFoundException('مقدار ویژگی یافت نشد');
    if (data.attributeId) {
      const attr = await this.attrRepo.findOne({ where: { id: data.attributeId } });
      if (!attr) throw new NotFoundException('ویژگی یافت نشد.');
      value.attribute = attr;
    }
    Object.assign(value, data);
    const saved = await this.attrRepo.save(value);
    return AttributeValueMapper.toResponse(saved);
  }

  async remove(id: number): Promise<Object> {
    const deletedValue = await this.valueRepo.delete(id);
    if (deletedValue.affected === 0) {
      throw new NotFoundException('مقدار ویژگی یافت نشد.');
    }
    return {
      message: 'حذف مقدار ویژگی با موفیت انجام شد',
      data: null,
    }
  }
}
