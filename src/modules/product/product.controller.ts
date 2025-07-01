import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MediaType } from 'src/common/enums/media.enum';
import { UploadFilesDto } from '../media/dto/upload-file.dto';
import { MediaService } from '../media/media.service';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
@ApiTags('08 - 📦 Products')
@Controller('product')
export class ProductController {
    constructor(
        private readonly productService: ProductService,
        private readonly uploadService: MediaService
    ) { }

    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 10))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'List of Category',
        type: UploadFilesDto
    })
    uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
        return this.uploadService.uploadFile(files, MediaType.PRODUCT);
    }

    @Post()
    create(@Body() data: CreateProductDto) {
        return this.productService.create(data);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProductDto) {
        return this.productService.update(id, data);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productService.findOne(id);
    }

    @Get('category/:title')
    findByCategoryTitle(@Param('title') title: string, @Paginate() query: PaginateQuery) {
        return this.productService.findByCategoryTitle(title, query);
    }
}