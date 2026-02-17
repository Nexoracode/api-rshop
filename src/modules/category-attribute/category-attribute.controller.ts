import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CategoryAttributeService } from './category-attribute.service';
import { CreateCategoryAttributeDto } from './dto/create-category-attribute.dto';
import { ApiTags } from '@nestjs/swagger';
import { UpdateCategoryAttribute } from './dto/update-category-attribute.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('07 - 🧩 Category Attributes')
@Controller('category-attribute')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
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
