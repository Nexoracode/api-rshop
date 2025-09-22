// product-attribute-value.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put } from "@nestjs/common";
import { ProductAttributeValueService } from "./product-attribute-value.service";
import { CreateProductAttributeValueDto } from "./dto/create-product-attribute-value.dto";
import { UpdateProductAttributeValueDto } from "./dto/update-product-attribute-value.dto";
import { ApiTags } from "@nestjs/swagger";

@Controller("product-attributes")
@ApiTags("10 - 🧲 Product Attributes")
export class ProductAttributeValueController {
  constructor(private readonly pavService: ProductAttributeValueService) { }

  @Post()
  create(@Body() dto: CreateProductAttributeValueDto) {
    return this.pavService.create(dto);
  }

  @Get("product/:productId")
  findByProduct(@Param("productId", ParseIntPipe) productId: number) {
    return this.pavService.findByProduct(productId);
  }

  @Patch(":id")
  async update(
    @Param("productId", ParseIntPipe) productId: number,
    @Param("attributeId", ParseIntPipe) attributeId: number,
    @Body() dto: UpdateProductAttributeValueDto,
  ) {
    return this.pavService.update(productId, attributeId, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.pavService.remove(id);
  }
}
