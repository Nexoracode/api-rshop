import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AttributeValueService } from './attribute-value.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { ApiTags } from '@nestjs/swagger';
import { UpdateSortDto } from '../attribute/dto/update-sort-attribute.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('06 - 🔠 Attribute Values')
@Controller('attribute-value')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attributeValueService.remove(id);
  }

  @Patch(':id/order')
  updateOrder(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateSortDto) {
    return this.attributeValueService.updateOrder(id, data);
  }
}
