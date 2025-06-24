import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CategoryAttributeService } from './category-attribute.service';
import { CreateCategoryAttributeDto } from './dto/create-category-attribute.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('07 - 🧩 Category Attributes')
@Controller('category-attribute')
export class CategoryAttributeController {
  constructor(private readonly service: CategoryAttributeService) { }

  @Post()
  assign(@Body() data: CreateCategoryAttributeDto) {
    return this.service.assign(data);
  }

  // @Get(':categoryId')
  // findOne(@Param('categoryId', ParseIntPipe) categoryId: number) {
  //   return this.service.generateAttributeForCategory(categoryId);
  // }


  // @Delete(':id')
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.service.remove(id);
  // }
}
