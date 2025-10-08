import { BadRequestException, Body, Controller, Delete, Get, Param, ParseArrayPipe, ParseIntPipe, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MediaType } from 'src/common/enums/media.enum';
import { UploadFilesDto } from '../media/dto/upload-file.dto';
import { MediaService } from '../media/media.service';
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery, PaginationType } from 'nestjs-paginate';
import { DeleteProductsDto } from './dto/delete-product.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { UpdateBulkDto } from './dto/update-bulk.dto';
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
        description: 'List of Products',
        type: UploadFilesDto
    })
    uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
        return this.uploadService.uploadFile(files, MediaType.PRODUCT);
    }

    @Get()
    @ApiPaginationQuery({
        paginationType: PaginationType.CURSOR,
        sortableColumns: ['id', 'name', 'price', 'stock'],
        filterableColumns: {
            'is_visible': [FilterOperator.EQ],
            'requires_preparation': [FilterOperator.EQ],
            'category_id': [FilterOperator.EQ],
            'brand_id': [FilterOperator.EQ],
            'created_at': [FilterOperator.GTE, FilterOperator.LTE, FilterOperator.BTW],
            'weight': [FilterOperator.GTE, FilterOperator.LTE],
            'discount_amount': [FilterOperator.GTE, FilterOperator.LTE],
            'discount_percent': [FilterOperator.GTE, FilterOperator.LTE],
            price: [FilterOperator.GTE, FilterOperator.LTE],
            stock: [FilterOperator.GTE, FilterOperator.LTE],

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

    @Public()
    @Get('site/:id')
    findOneForSite(@Param('id', ParseIntPipe) id: number) {
        return this.productService.findOneForSite(id);
    }

    @ApiOperation({
        summary: "ویرایش گروهی محصولات (ادمین)",
        description:
            "با استفاده از این متد می‌توانید چند محصول را به‌صورت همزمان ویرایش کنید. \
می‌توانید وضعیت نمایش، ویژه بودن، قیمت، یا تخفیف درصدی/مبلغی را تغییر دهید.\n\n تغییر وضعیت قیمت : PriceMode\n\nset : قیمت جدید \n\n increase : افزایش قیمت\n\n decrease : کاهش قیمت",
    })
    @Patch('update/bulk')
    updateBulk(@Body() dto: UpdateBulkDto) {
        return this.productService.updateBulk(dto.ids, dto);
    }

    @Delete('delete/bulk')
    removeBulk(@Body() dto: DeleteProductsDto) {
        return this.productService.removeBulk(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.productService.remove(id);
    }

}