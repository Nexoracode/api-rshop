import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AttributeGroupService } from './attribute-group.service';
import { CreateAttributeGroupDto } from './dto/create-attribute-group.dto';
import { UpdateAttributeGroupDto } from './dto/update-attribute-group.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('04 - 📁 Attribute Groups')
@Controller('attribute-group')
export class AttributeGroupController {
  constructor(private readonly attributeGroupService: AttributeGroupService) { }

  @Post()
  create(@Body() data: CreateAttributeGroupDto) {
    return this.attributeGroupService.create(data);
  }

  @Get()
  findAll() {
    return this.attributeGroupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attributeGroupService.findOne(id);
  }


  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateAttributeGroupDto) {
    return this.attributeGroupService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attributeGroupService.remove(id);
  }

  @Patch(':id/order')
  updateOrder(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateAttributeGroupDto) {
    return this.attributeGroupService.updateOrder(id, data.displayOrder ?? 0);
  }
}
