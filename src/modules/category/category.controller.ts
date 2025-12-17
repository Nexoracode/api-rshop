import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadFilesDto } from '../media/dto/upload-file.dto';
import { MediaType } from 'src/common/enums/media.enum';
import { MediaService } from '../media/media.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { SeoService } from '../seo/seo.service';
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery, PaginationType } from 'nestjs-paginate';

const MAX_FILE_UPLOAD = 10;

@ApiTags('03 - 🗂️ Categories')
@Controller('category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly uploadService: MediaService,
    private readonly seoService: SeoService,
  ) { }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', MAX_FILE_UPLOAD))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'List of Category',
    type: UploadFilesDto
  })
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadFile(files, MediaType.CATEGORY);
  }

  @Post()
  async createCategory(@Body() createDto: CreateCategoryDto) {
    return this.categoryService.create(createDto);
  }

  @Get()
  @ApiPaginationQuery({
    paginationType: PaginationType.CURSOR,
    sortableColumns: ['id', 'title', 'level', 'displayOrder'],
    defaultSortBy: [['displayOrder', 'ASC']],
    filterableColumns: {
      isActive: [FilterOperator.EQ],
      discount: [FilterOperator.GTE, FilterOperator.LTE],
    },
    searchableColumns: ['title', 'description', 'slug'],
  })
  async findAllTree(@Paginate() query: PaginateQuery) {
    return this.categoryService.findAllTree(query);
  }

  @Public()
  @Get('site')
  async findAllTreeSite() {
    return this.categoryService.findAllTreeForSite();
  }

  @Public()
  @Get('site/seo/:slug')
  async findOneSeo(@Param('slug') slug: string) {
    const category = await this.categoryService.findOneSlug(slug);
    const seo = this.seoService.generateCategoryMeta(category);
    return seo;
  }

  @Public()
  @Get('site/:slug')
  async findOneSlug(@Param('slug') slug: string) {
    return this.categoryService.findOneSlug(slug);
  }

  // ✅ اضافه: دریافت دسته با تمام parent ها و breadcrumb
  @Public()
  @Get('site/with-parents/slug/:slug')
  @ApiOperation({
    summary: 'دریافت دسته‌بندی با slug به همراه تمام parent ها',
    description: 'این endpoint دسته‌بندی را به همراه آرایه‌ای از تمام parent ها (از بالاترین تا پایین‌ترین) و breadcrumb کامل برمی‌گرداند',
  })
  async findBySlugWithParents(@Param('slug') slug: string) {
    return this.categoryService.findBySlugWithParents(slug);
  }

  // ✅ اضافه: دریافت دسته با ID به همراه تمام parent ها
  @Public()
  @Get('site/with-parents/id/:id')
  @ApiOperation({
    summary: 'دریافت دسته‌بندی با ID به همراه تمام parent ها',
    description: 'این endpoint دسته‌بندی را به همراه آرایه‌ای از تمام parent ها (از بالاترین تا پایین‌ترین) و breadcrumb کامل برمی‌گرداند',
  })
  async findByIdWithParents(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findByIdWithParents(id);
  }

  @Get(':id')
  async findByIdWithDescendants(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findByIdWithDescendants(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateCategoryDto) {
    return this.categoryService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
