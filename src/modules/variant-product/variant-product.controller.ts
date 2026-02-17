import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { VariantProductService } from './variant-product.service';
import { CreateVariantProductDto } from './dto/create-variant-product.dto';
import { UpdateVariantProductDto } from './dto/update-variant-product.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
@ApiTags('09 - 🎭 Variant Products')
@ApiBearerAuth()
@Controller('variant-product')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
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
