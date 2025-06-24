import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttributeGroupDto } from './dto/create-attribute-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AttributeGroup } from './entities/attribute-group.entity';
import { Repository } from 'typeorm';
import { IAttributeGroupService } from './interfaces/attribute-group.service';
import { UpdateAttributeGroupDto } from './dto/update-attribute-group.dto';
import { IAttributeGroupResponse } from './interfaces/attribute-group.response.interface';
import { AttributeGroupMapper } from './mappers/attribute-group.mapper';

@Injectable()
export class AttributeGroupService implements IAttributeGroupService {
  constructor(
    @InjectRepository(AttributeGroup)
    private readonly attrGroupRepo: Repository<AttributeGroup>,
  ) { }
  async create(data: CreateAttributeGroupDto): Promise<IAttributeGroupResponse> {
    const existsName = await this.attrGroupRepo.findOne({ where: { name: data.name } });
    if (existsName) throw new BadRequestException('نام "گروه ویژگی" تکراری می باشد..')
    const existsSlug = await this.attrGroupRepo.findOne({ where: { slug: data.slug } });
    if (existsSlug) throw new BadRequestException('نامک "گروه ویژگی" تکراری می باشد..')
    const attrGroup = this.attrGroupRepo.create(data);
    const savedGroup = await this.attrGroupRepo.save(attrGroup);
    return AttributeGroupMapper.toResponse(savedGroup);
  }
  async update(id: number, data: UpdateAttributeGroupDto): Promise<IAttributeGroupResponse> {
    const attrGroup = await this.attrGroupRepo.findOne({ where: { id } });
    if (!attrGroup) throw new NotFoundException('گروه ویژگی مورد نظر یافت نشد.');
    const updatedGroup = this.attrGroupRepo.merge(attrGroup, data);
    const savedGroup = await this.attrGroupRepo.save(updatedGroup);
    return AttributeGroupMapper.toResponse(savedGroup);
  }
  async findOne(id: number): Promise<IAttributeGroupResponse> {
    const attrGroup = await this.attrGroupRepo.findOne({ where: { id }, relations: ['attributes'] });
    if (!attrGroup) throw new NotFoundException('گروه ویژگی مورد نظر یافت نشد.');
    return AttributeGroupMapper.toResponse(attrGroup);
  }
  async findAll(): Promise<IAttributeGroupResponse[]> {
    const attributeGroups = await this.attrGroupRepo.find({ relations: ['attributes'] });
    return attributeGroups.map((attr) => AttributeGroupMapper.toResponse(attr));
  }
}
