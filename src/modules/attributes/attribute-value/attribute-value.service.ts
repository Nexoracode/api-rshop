import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AttributeValue } from './entities/attribute-value.entity';
import { AttributeService } from '../attribute/attribute.service';
import { In, Repository } from 'typeorm';

@Injectable()
export class AttributeValueService {
  constructor(
    @InjectRepository(AttributeValue)
    private readonly avRepo: Repository<AttributeValue>,
    private readonly attributeService: AttributeService
  ) { }

  // async create(createDto: CreateAttributeValueDto) {
  //   const attribute = await this.attributeService.findOne(createDto.attributeId);
  //   const attributeValue = this.avRepo.create({
  //     ...createDto,
  //     attribute,
  //   });
  //   return this.avRepo.save(attributeValue);
  // }

  async findAll() {
    return await this.avRepo.find({ relations: ['attribute'] });
  }

  async findOne(id: number) {
    const av = await this.avRepo.findOne({ where: { id: id }, relations: ['attribute'] });
    if (!av) throw new NotFoundException('attribute not found');
    return av;
  }

  async findBy(ids: number[]) {
    const av = await this.avRepo.findBy({ id: In(ids) })
    if (!av) throw new NotFoundException('not found attribute values ids');
    return av;
  }

  async update(id: number, updateDto: UpdateAttributeValueDto) {
    const av = await this.avRepo.preload({ id, ...updateDto, attribute: { id: updateDto.attributeId } });
    if (!av) throw new NotFoundException('attribute value not found');
    return await this.avRepo.save(av);
  }

  async remove(id: number) {
    const av = await this.findOne(id);
    this.avRepo.remove(av);
    return await this.avRepo.save(av);
  }
}
