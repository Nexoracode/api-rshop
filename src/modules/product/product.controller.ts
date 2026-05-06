import { BadRequestException, Body, Controller, Delete, Get, Param, ParseArrayPipe, ParseIntPipe, Patch, Post, UploadedFiles, UseInterceptors, Req, UseGuards } from '@nestjs/common';
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
import { SeoService } from '../seo/seo.service';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RequestUser } from 'src/common/interfaces/request-user.interface';

@ApiTags('08 - 📦 Products')
@Controller('product')
export class ProductController {
    constructor(
        private readonly productService: ProductService,
        private readonly uploadService: MediaService,
        private readonly seoService: SeoService,
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
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @ApiPaginationQuery({
        paginationType: PaginationType.CURSOR,
        sortableColumns: ['id', 'name', 'price', 'stock'],
        searchableColumns: ['name'],
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

    @Public()
    @Get('ids')
    findAllId() {
        return this.productService.getAllProducts();
    }

    @Post()
    create(@Body() data: CreateProductDto, @CurrentUser() user: User) {
        // ✅ ارسال userId به service
        console.log(user);
        const userId = user ? user.id : 1;
        return this.productService.create(data, userId);
    }

    @Patch(':id')
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProductDto, @CurrentUser() user: User) {
        return this.productService.update(id, data, user.id);
    }

    @Get(':id')
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productService.findOne(id);
    }

    @Public()
    @Get('site/:id')
    async findOneForSite(@Param('id', ParseIntPipe) id: number) {
        const product = await this.productService.findOneForSite(id);
        let seo: any = null;
        if (product.isVisible) {
            seo = this.seoService.generateProductMeta(product);
            return { product, seo };
        } else {
            return {
                product: null,
                message: 'این محصول در حال حاظر قابل نمایش نیست.',
                isVisible: product.isVisible
            }
        }
    }

    @ApiOperation({
        summary: "ویرایش گروهی محصولات (ادمین)",
        description:
            "با استفاده از این متد می‌توانید چند محصول را به‌صورت همزمان ویرایش کنید. \
می‌توانید وضعیت نمایش، ویژه بودن، قیمت، یا تخفیف درصدی/مبلغی را تغییر دهید.\n\n تغییر وضعیت قیمت : PriceMode\n\nset : قیمت جدید \n\n increase : افزایش قیمت\n\n decrease : کاهش قیمت",
    })
    @Patch('update/bulk')
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    updateBulk(@Body() dto: UpdateBulkDto) {
        return this.productService.updateBulk(dto.ids, dto);
    }

    @Delete('delete/bulk')
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    removeBulk(@Body() dto: DeleteProductsDto) {
        return this.productService.removeBulk(dto.ids);
    }

    @Delete(':id')
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.productService.remove(id);
    }

    /**
     * دریافت محصولات مشابه (Public)
     * GET /product/:id/similar?limit=8
     */
    @Public()
    @Get(':id/similar')
    @ApiOperation({
        summary: 'دریافت محصولات مشابه',
        description: 'محصولات مشابه بر اساس دسته‌بندی و برند محصول اصلی'
    })

    @ApiResponse({
        status: 200,
        description: 'لیست محصولات مشابه'
    })
    async findSimilarProducts(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.productService.findSimilarProducts(id, 10);
    }
}
