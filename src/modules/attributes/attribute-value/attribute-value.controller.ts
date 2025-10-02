import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AttributeValueService } from './attribute-value.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('06 - 🔠 Attribute Values')
@Controller('attribute-value')
export class AttributeValueController {
  constructor(private readonly attributeValueService: AttributeValueService) { }

  @Post()
  create(@Body() createAttributeValueDto: CreateAttributeValueDto) {
    return this.attributeValueService.create(createAttributeValueDto);
  }

  @Get('attribute/:id')
  findByAttribute(@Param('id', ParseIntPipe) id: number) {
    return this.attributeValueService.findByAttribute(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateAttributeValueDto: UpdateAttributeValueDto) {
    return this.attributeValueService.update(id, updateAttributeValueDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attributeValueService.remove(id);
  }

  @Patch(':id/order')
  updateOrder(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateAttributeValueDto) {
    return this.attributeValueService.updateOrder(id, data.displayOrder ?? 0);
  }
}
