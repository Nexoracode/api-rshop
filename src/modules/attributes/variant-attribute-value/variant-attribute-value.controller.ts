import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VariantAttributeValueService } from './variant-attribute-value.service';
import { CreateVariantAttributeValueDto } from './dto/create-variant-attribute-value.dto';
import { UpdateVariantAttributeValueDto } from './dto/update-variant-attribute-value.dto';

@Controller('variant-attribute-value')
export class VariantAttributeValueController {
  constructor(private readonly variantAttributeValueService: VariantAttributeValueService) { }

  @Post()
  create(@Body() createVariantAttributeValueDto: CreateVariantAttributeValueDto) {
    return this.variantAttributeValueService.create(createVariantAttributeValueDto);
  }

  @Get()
  findAll() {
    return this.variantAttributeValueService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.variantAttributeValueService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVariantAttributeValueDto: UpdateVariantAttributeValueDto) {
    return this.variantAttributeValueService.update(+id, updateVariantAttributeValueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.variantAttributeValueService.remove(+id);
  }
}
