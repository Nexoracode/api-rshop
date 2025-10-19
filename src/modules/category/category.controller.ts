import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UploadFilesDto } from '../media/dto/upload-file.dto';
import { MediaType } from 'src/common/enums/media.enum';
import { MediaService } from '../media/media.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from 'src/common/decorator/public.decorator';

const MAX_FILE_UPLOAD = 10;

@ApiTags('03 - 🗂️ Categories')
@Controller('category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly uploadService: MediaService,
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
  async findAllTree() {
    return this.categoryService.findAllTree();
  }

  @Public()
  @Get('site')
  async findAllTreeSite() {
    return this.categoryService.findAllTreeForSite();
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
