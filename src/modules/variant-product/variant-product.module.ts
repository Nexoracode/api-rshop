import { Module } from '@nestjs/common';
import { VariantProductService } from './variant-product.service';
import { VariantProductController } from './variant-product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantProduct } from './entities/variant-product.entity';
import { ProductModule } from '../product/product.module';
import { Product } from '../product/entities/product.entity';
import { VariantAttributeValue } from '../attributes/variant-attribute-value/entities/variant-attribute-value.entity';
import { ProductCacheService } from '../product/cache';
import { CatalogCacheService } from '../catalogs/cache';

@Module({
  imports: [TypeOrmModule.forFeature([VariantProduct, VariantAttributeValue, Product])],
  controllers: [VariantProductController],
  providers: [VariantProductService, ProductCacheService, CatalogCacheService],
})
export class VariantProductModule { }
