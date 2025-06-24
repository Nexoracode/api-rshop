import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AttributeGroupService } from './attribute-group.service';
import { CreateAttributeGroupDto } from './dto/create-attribute-group.dto';
import { UpdateAttributeGroupDto } from './dto/update-attribute-group.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('06 - 📁 Attribute Groups')
@Controller('attribute-group')
export class AttributeGroupController {
  constructor(private readonly attributeGroupService: AttributeGroupService) { }

  @Post()
  create(@Body() createAttributeGroupDto: CreateAttributeGroupDto) {
    return this.attributeGroupService.create(createAttributeGroupDto);
  }

  @Get()
  findAll() {
    return this.attributeGroupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attributeGroupService.findOne(id);
  }

  // @Patch(':id')
  // update(@Param('id', ParseIntPipe) id: number, @Body() updateAttributeGroupDto: UpdateAttributeGroupDto) {
  //   return this.attributeGroupService.update(+id, updateAttributeGroupDto);
  // }

  // @Delete(':id')
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.attributeGroupService.remove(+id);
  // }
}
