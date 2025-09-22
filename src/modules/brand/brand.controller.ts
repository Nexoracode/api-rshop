import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiPaginationQuery, Paginate } from 'nestjs-paginate';
import { PaginateQuery } from 'nestjs-paginate';

@ApiTags('12 - 🎟 Brands')
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) { }

  @Post()
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandService.create(createBrandDto);
  }

  @Get()
  @ApiPaginationQuery({
    sortableColumns: ['id', 'name', 'logo'],
    searchableColumns: ['name'],
    defaultSortBy: [['id', 'DESC']],
    select: ['id', 'name', 'logo'],
  })
  findAllPaginate(@Paginate() query: PaginateQuery) {
    return this.brandService.findAllPaginate(query);
  }

  @Get('all')
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandService.update(+id, updateBrandDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandService.remove(+id);
  }
}
