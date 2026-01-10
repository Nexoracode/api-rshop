import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CollectionService } from './collection.service';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('🛍️ Collections (Public)')
@Controller('collections')
@Public()
export class CollectionPublicController {
  constructor(private readonly collectionService: CollectionService) { }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'لیست تمام مجموعه‌های فعال',
    description: 'دریافت لیست تمام مجموعه‌هایی که فعال هستند و در بازه زمانی مناسب قرار دارند',
  })
  @ApiResponse({
    status: 200,
    description: 'لیست مجموعه‌ها با موفقیت دریافت شد',
  })
  async findAll() {
    const collections = await this.collectionService.findAll();

    return {
      message: 'لیست مجموعه‌ها با موفقیت دریافت شد',
      data: collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        slug: collection.slug,
        description: collection.description,
        image: collection.image,
        productsCount: collection.products?.length || 0,
        sortOrder: collection.sortOrder,
        startDate: collection.startDate,
        endDate: collection.endDate,
      })),
    };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({
    summary: 'جزئیات یک مجموعه با slug',
    description: 'دریافت اطلاعات کامل یک مجموعه به همراه محصولات آن',
  })
  @ApiParam({
    name: 'slug',
    description: 'نامک (slug) مجموعه',
    example: 'fathers-day-gifts',
  })
  @ApiResponse({
    status: 200,
    description: 'جزئیات مجموعه با موفقیت دریافت شد',
  })
  @ApiResponse({
    status: 404,
    description: 'مجموعه یافت نشد',
  })
  async findOne(@Param('slug') slug: string) {
    return this.collectionService.findOneBySlug(slug);
  }

  // @Public()
  // @Get(':slug/products')
  // @ApiOperation({
  //   summary: 'محصولات یک مجموعه',
  //   description: 'دریافت فقط محصولات یک مجموعه (بدون اطلاعات مجموعه)',
  // })
  // @ApiParam({
  //   name: 'slug',
  //   description: 'نامک (slug) مجموعه',
  //   example: 'fathers-day-gifts',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'محصولات با موفقیت دریافت شد',
  // })
  // async getProducts(@Param('slug') slug: string) {
  //   const products = await this.collectionService.getCollectionProducts(slug);

  //   return {
  //     message: 'محصولات مجموعه با موفقیت دریافت شد',
  //     data: products.map((product) => ({
  //       id: product.id,
  //       name: product.name,
  //       slug: product.sku,
  //       price: Number(product.price),
  //       discountPercent: Number(product.discountPercent) || 0,
  //       discountAmount: Number(product.discountAmount) || 0,
  //       stock: product.stock,
  //       image: product.mediaPinned?.url || null,
  //     })),
  //   };
  // }
}