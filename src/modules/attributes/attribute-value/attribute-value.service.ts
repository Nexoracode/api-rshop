import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AttributeValue } from './entities/attribute-value.entity';
import { In, Repository } from 'typeorm';
import { IAttributeValueService } from './interfaces/attribute-value.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { IAttributeValueResponse } from './interfaces/attribute-value.response.interface';
import { Attribute } from '../attribute/entities/attribute.entity';
import { AttributeValueMapper } from './mappers/attribute-value.mapper';
import { ProductCacheService } from 'src/modules/product/cache';
import { CatalogCacheService } from 'src/modules/catalogs/cache';
import { UpdateSortDto } from '../attribute/dto/update-sort-attribute.dto';

@Injectable()
export class AttributeValueService implements IAttributeValueService {
  constructor(
    @InjectRepository(AttributeValue)
    private readonly valueRepo: Repository<AttributeValue>,
    @InjectRepository(Attribute)
    private readonly attrRepo: Repository<Attribute>,
    private readonly productCatchService: ProductCacheService,
    private readonly catalogCatchService: CatalogCacheService,
  ) { }

  async updateOrder(id: number, data: UpdateSortDto): Promise<Object> {
    const value = await this.valueRepo.findOne({ where: { id } });
    if (!value) throw new NotFoundException('مقدار ویژگی مورد نظر یافت نشد.');
    value.displayOrder = data.displayOrder;
    // ✅ پاک کردن cache بعد از update
    await this.valueRepo.save(value);
    await this.productCatchService.clearProductCache(data.productId);
    await this.catalogCatchService.clearAllCatalogCache();
    return {
      message: 'ترتیب با موفقیت انجام شد',
      data: null,
    }
  }

  async findByAttribute(attributeId: number): Promise<IAttributeValueResponse[]> {
    const values = await this.valueRepo.find({ where: { attributeId }, order: { displayOrder: 'ASC' } })
    return values.map((value) => AttributeValueMapper.toResponse(value));
  }

  async create(data: CreateAttributeValueDto): Promise<IAttributeValueResponse> {
    const attr = await this.attrRepo.findOne({ where: { id: data.attributeId } });
    if (!attr) throw new NotFoundException('ویژگی یافت نشد');
    const existsValue = await this.valueRepo.findOne({ where: { value: data.value } })
    if (existsValue) throw new BadRequestException('این ویژگی از قبل ثبت شده است.');
    const lastAttrValue = await this.valueRepo.find({
      order: { displayOrder: 'DESC' },
      take: 1,
    })
    const nextOrder = lastAttrValue.length ? lastAttrValue[0].displayOrder + 1 : 1;
    const value = this.valueRepo.create({
      ...data,
      displayOrder: nextOrder,
    });
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
      value.attributeId = data.attributeId;
    }
    if (data.value) {
      const existValue = await this.valueRepo.findOne({ where: { value: data.value } });
      if (existValue && existValue.id != id) {
        throw new BadRequestException('این ویژگی از قبل ثبت شده است.');
      }
    }
    const updatedValue = await this.valueRepo.merge(value, data);
    const saved = await this.valueRepo.save(updatedValue);
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
