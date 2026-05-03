import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { CategoryModule } from '../category/category.module';
import { VariantAttributeValueModule } from '../attributes/variant-attribute-value/variant-attribute-value.module';
import { MediaModule } from '../media/media.module';
import { UploadService } from 'src/common/services/upload.service';
import { Review } from '../review/entities/review.entity';
import { SeoModule } from '../seo/seo.module';
import { ProductCacheService } from './cache/product-cache.service'; // ✅ اضافه شد
import { CatalogCacheService } from '../catalogs/cache';
import { PromotionConditionOrmEntity } from '../promotion/infrastructure/entities/promotion-condition.orm-entity';
import { PromotionOrmEntity } from '../promotion/infrastructure/entities/promotion.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Review, PromotionOrmEntity]),
    CategoryModule,
    VariantAttributeValueModule,
    MediaModule,
    SeoModule,
  ],
  providers: [
    ProductService,
    UploadService,
    ProductCacheService, // ✅ اضافه شد
    CatalogCacheService,
  ],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule { }
