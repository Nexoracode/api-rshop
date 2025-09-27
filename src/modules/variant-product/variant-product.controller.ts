import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { VariantProductService } from './variant-product.service';
import { CreateVariantProductDto } from './dto/create-variant-product.dto';
import { UpdateVariantProductDto } from './dto/update-variant-product.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('09 - 🎭 Variant Products')
@Controller('variant-product')
export class VariantProductController {
  constructor(private readonly variantProductService: VariantProductService) { }

  @Post()
  create(@Body() createVariantProductDto: CreateVariantProductDto) {
    return this.variantProductService.create(createVariantProductDto);
  }

  @Get('product/:id')
  findByProduct(@Param('id', ParseIntPipe) id: number, @Query('grouped') grouped?: 'true') {
    return this.variantProductService.findOne(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Query('grouped') grouped?: 'true') {
    return this.variantProductService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateVariantProductDto: UpdateVariantProductDto) {
    return this.variantProductService.update(id, updateVariantProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.variantProductService.remove(id);
  }

  @Delete("product/:productId/attributes/:attributeId/values/:valueId")
  async removeByValue(
    @Param("productId", ParseIntPipe) productId: number,
    @Param("attributeId", ParseIntPipe) attributeId: number,
    @Param("valueId", ParseIntPipe) valueId: number,
  ) {
    return this.variantProductService.removeByVariant(productId, attributeId, valueId);
  }

}
