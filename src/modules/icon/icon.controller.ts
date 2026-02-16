import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { IconService } from './icon.service';
import { CreateIconDto } from './dto/create-icon.dto';
import { UpdateIconDto } from './dto/update-icon.dto';
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('icons')
@ApiTags('🧊 - Icons')
export class IconController {
  constructor(private readonly iconService: IconService) { }

  @Post()
  @ApiOperation({ summary: 'افزودن آیکون' })
  create(@Body() createIconDto: CreateIconDto) {
    return this.iconService.create(createIconDto);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت لیست آیکون' })
  @ApiPaginationQuery({
    sortableColumns: ['id', 'name', 'createdAt'],
    defaultSortBy: [['createdAt', 'DESC']],
    searchableColumns: ['name'],
  })
  findAll(@Paginate() query: PaginateQuery) {
    return this.iconService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات یک آیکون ' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.iconService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش آیکون یک آیکون ' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateIconDto: UpdateIconDto) {
    return this.iconService.update(id, updateIconDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف آیکون یک آیکون ' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.iconService.remove(id);
  }
}
