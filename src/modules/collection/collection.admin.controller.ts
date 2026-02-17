import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddProductsToCollectionDto } from './dto/add-product-to-collection.dto';

@ApiTags('🛍️ Collections (Admin)')
@Controller('admin/collections')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
@ApiBearerAuth()
export class CollectionAdminController {
    constructor(private readonly collectionService: CollectionService) { }

    @Post()
    @ApiOperation({
        summary: 'ساخت مجموعه جدید',
        description: 'ایجاد یک مجموعه جدید با امکان اضافه کردن محصولات',
    })
    @ApiResponse({
        status: 201,
        description: 'مجموعه با موفقیت ایجاد شد',
    })
    @ApiResponse({
        status: 409,
        description: 'slug یا title تکراری است',
    })
    async create(@Body() createDto: CreateCollectionDto) {
        const collection = await this.collectionService.create(createDto);

        return {
            message: 'مجموعه با موفقیت ایجاد شد',
            data: collection,
        };
    }

    @Get()
    @ApiOperation({
        summary: 'لیست تمام مجموعه‌ها (بدون فیلتر)',
        description: 'دریافت تمام مجموعه‌ها شامل غیرفعال و منقضی شده',
    })
    @ApiResponse({
        status: 200,
        description: 'لیست مجموعه‌ها با موفقیت دریافت شد',
    })
    async findAll() {
        const collections = await this.collectionService.findAllAdmin();

        return {
            message: 'لیست مجموعه‌ها با موفقیت دریافت شد',
            data: collections.map((collection) => ({
                id: collection.id,
                title: collection.title,
                slug: collection.slug,
                description: collection.description,
                image: collection.image,
                isActive: collection.isActive,
                displayOrder: collection.displayOrder,
                startDate: collection.startDate,
                endDate: collection.endDate,
                productsCount: collection.products?.length || 0,
                createdAt: collection.createdAt,
                updatedAt: collection.updatedAt,
            })),
        };
    }

    @Get(':id')
    @ApiOperation({
        summary: 'جزئیات یک مجموعه',
        description: 'دریافت اطلاعات کامل یک مجموعه به همراه محصولات',
    })
    @ApiParam({
        name: 'id',
        description: 'شناسه مجموعه',
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'جزئیات مجموعه با موفقیت دریافت شد',
    })
    @ApiResponse({
        status: 404,
        description: 'مجموعه یافت نشد',
    })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const collection = await this.collectionService.findOne(id);

        return {
            message: 'جزئیات مجموعه با موفقیت دریافت شد',
            data: {
                ...collection,
                products: collection.products.map((product) => ({
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    stock: product.stock,
                    image: product.mediaPinned?.url || null,
                })),
            },
        };
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'بروزرسانی مجموعه',
        description: 'ویرایش اطلاعات یک مجموعه',
    })
    @ApiParam({
        name: 'id',
        description: 'شناسه مجموعه',
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'مجموعه با موفقیت بروزرسانی شد',
    })
    @ApiResponse({
        status: 404,
        description: 'مجموعه یافت نشد',
    })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateCollectionDto,
    ) {
        const collection = await this.collectionService.update(id, updateDto);

        return {
            message: 'مجموعه با موفقیت بروزرسانی شد',
            data: collection,
        };
    }

    @Post(':id/products')
    @ApiOperation({
        summary: 'اضافه کردن محصولات به مجموعه',
        description: 'افزودن محصولات جدید به مجموعه (محصولات تکراری نادیده گرفته می‌شوند)',
    })
    @ApiParam({
        name: 'id',
        description: 'شناسه مجموعه',
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'محصولات با موفقیت اضافه شدند',
    })
    async addProducts(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AddProductsToCollectionDto,
    ) {
        const collection = await this.collectionService.addProducts(id, dto);

        return {
            message: 'محصولات با موفقیت اضافه شدند',
            data: {
                collectionId: collection.id,
                totalProducts: collection.products.length,
            },
        };
    }

    @Delete(':collectionId/products/:productId')
    @ApiOperation({
        summary: 'حذف محصول از مجموعه',
        description: 'حذف یک محصول از مجموعه',
    })
    @ApiParam({
        name: 'collectionId',
        description: 'شناسه مجموعه',
        example: 1,
    })
    @ApiParam({
        name: 'productId',
        description: 'شناسه محصول',
        example: 5,
    })
    @ApiResponse({
        status: 200,
        description: 'محصول با موفقیت حذف شد',
    })
    async removeProduct(
        @Param('collectionId', ParseIntPipe) collectionId: number,
        @Param('productId', ParseIntPipe) productId: number,
    ) {
        await this.collectionService.removeProduct(collectionId, productId);

        return {
            message: 'محصول از مجموعه حذف شد',
        };
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'حذف مجموعه',
        description: 'حذف کامل یک مجموعه (محصولات حذف نمی‌شوند)',
    })
    @ApiParam({
        name: 'id',
        description: 'شناسه مجموعه',
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'مجموعه با موفقیت حذف شد',
    })
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.collectionService.remove(id);

        return {
            message: 'مجموعه با موفقیت حذف شد',
        };
    }
}