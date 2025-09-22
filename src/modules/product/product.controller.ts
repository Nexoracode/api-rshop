import { BadRequestException, Body, Controller, Delete, Get, Param, ParseArrayPipe, ParseIntPipe, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MediaType } from 'src/common/enums/media.enum';
import { UploadFilesDto } from '../media/dto/upload-file.dto';
import { MediaService } from '../media/media.service';
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery, PaginationType } from 'nestjs-paginate';
import { DeleteProductsDto } from './dto/delete-product.dto';
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

    @Get()
    @ApiPaginationQuery({
        paginationType: PaginationType.CURSOR,
        sortableColumns: ['id', 'name', 'price', 'stock'],
        defaultSortBy: [['id', 'DESC']],
        searchableColumns: ['name', 'category'],
        relations: ['media', 'mediaPinned', 'category.title'],
        select: ['id', 'name', 'price', 'stock', 'isVisible', 'media', 'media.id', 'media.url', 'media.type', 'mediaPinned.id', 'mediaPinned.url', 'mediaPinned.type', 'category.id', 'category.title'],
        filterableColumns: {
            isVisible: [FilterOperator.EQ],
            requiresPreparation: [FilterOperator.EQ],
            categoryId: [FilterOperator.EQ],
            brandId: [FilterOperator.EQ],
            helperId: [FilterOperator.EQ],
            price: [FilterOperator.GTE, FilterOperator.LTE],
            stock: [FilterOperator.GTE, FilterOperator.LTE],
            name: [FilterOperator.EQ, FilterOperator.ILIKE],
            id: [FilterOperator.EQ, FilterOperator.IN],

        }
    })
    findAll(@Paginate() query: PaginateQuery) {
        return this.productService.findAll(query);
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

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.productService.remove(id);
    }

    @Delete('bulk')
    removeBulk(@Body() dto: DeleteProductsDto) {
        return this.productService.removeBulk(dto.ids);
    }
}