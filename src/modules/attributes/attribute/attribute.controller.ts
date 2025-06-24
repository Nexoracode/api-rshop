import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('05 - 🧬 Attributes')
@Controller('attribute')
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) { }

  @Post()
  create(@Body() createAttributeDto: CreateAttributeDto) {
    return this.attributeService.create(createAttributeDto);
  }

  @Get()
  findAll(@Query('grouped') grouped: string = 'true') {
    return this.attributeService.findAll(grouped === 'true');
  }

  @Get('group/:id')
  findByGroup(@Param('id', ParseIntPipe) id: number) {
    return this.attributeService.findByGroup(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateAttributeDto) {
    return this.attributeService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attributeService.remove(id);
  }
}
