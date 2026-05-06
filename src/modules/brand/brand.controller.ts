import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, UseGuards } from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ApiPaginationQuery, Paginate, PaginateQuery } from 'nestjs-paginate';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadFilesDto } from '../media/dto/upload-file.dto';
import { MediaType } from 'src/common/enums/media.enum';
import { MediaService } from '../media/media.service';
import { Public } from 'src/common/decorator/public.decorator';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('12 - 🎟 Brands')
@Controller('brand')
export class BrandController {
  constructor(
    private readonly brandService: BrandService,
    private readonly uploadService: MediaService,
  ) { }


  @Public()
  @Get('slugs')
  async getSlugsBrand() {
    return this.brandService.allSlugs();
  }

  @Public()
  @Get('find/:slug')
  findOneSlug(@Param('slug') slug: string) {
    return this.brandService.findOneBySlug(slug);
  }

  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'List of brands', type: UploadFilesDto })
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadFile(files, MediaType.BRAND);
  }

  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @Post()
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandService.create(createBrandDto);
  }

  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
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

  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @Get('all')
  findAll() {
    return this.brandService.findAll();
  }

  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(+id);
  }

  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandService.update(+id, updateBrandDto);
  }

  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandService.remove(+id);
  }
}
