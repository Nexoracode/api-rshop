// product-attribute-value.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { ProductAttributeValueService } from "./product-attribute-value.service";
import { CreateProductAttributeValueDto } from "./dto/create-product-attribute-value.dto";
import { UpdateProductAttributeValueDto } from "./dto/update-product-attribute-value.dto";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AddedImportantDto } from "./dto/added-important.dto";
import { AccessGuard } from "src/common/guard/access.guard";
import { RoleGuard } from "src/common/guard/role.guard";
import { Roles } from "src/common/decorator/role.decorator";
import { Role } from "src/common/enums/role.enum";

@Controller("product-attributes")
@ApiTags("10 - 🧲 Product Attributes")
@ApiBearerAuth()
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
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

  @Patch("important")
  updateImportant(@Body() data: AddedImportantDto) {
    return this.pavService.addedImportant(data);
  }

  @Patch(":id")
  async update(
    @Param("productId", ParseIntPipe) productId: number,
    @Param("attributeId", ParseIntPipe) attributeId: number,
    @Body() dto: UpdateProductAttributeValueDto,
  ) {
    return this.pavService.update(productId, attributeId, dto);
  }


  @Patch(':id/order')
  updateOrder(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProductAttributeValueDto) {
    return this.pavService.updateOrder(id, data.displayOrder ?? 0);
  }

  @Delete("product/:productId/attributes/:attributeId/values/:valueId")
  async removeByValue(
    @Param("productId", ParseIntPipe) productId: number,
    @Param("attributeId", ParseIntPipe) attributeId: number,
    @Param("valueId", ParseIntPipe) valueId: number,
  ) {
    return this.pavService.removeByProductAttribute(productId, attributeId, valueId);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.pavService.remove(id);
  }

}
