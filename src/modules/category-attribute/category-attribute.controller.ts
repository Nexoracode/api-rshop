import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CategoryAttributeService } from './category-attribute.service';
import { CreateCategoryAttributeDto } from './dto/create-category-attribute.dto';
import { ApiTags } from '@nestjs/swagger';
import { UpdateCategoryAttribute } from './dto/update-category-attribute.dto';
@ApiTags('07 - 🧩 Category Attributes')
@Controller('category-attribute')
export class CategoryAttributeController {
  constructor(private readonly service: CategoryAttributeService) { }

  @Post()
  assign(@Body() data: CreateCategoryAttributeDto) {
    return this.service.assign(data);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateCategoryAttribute) {
    return this.service.update(id, data);
  }

  @Get('category/:id')
  findByCategory(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByCategory(id);
  }
}
