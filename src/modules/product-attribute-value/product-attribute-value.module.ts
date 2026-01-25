import { Module } from '@nestjs/common';
import { ProductAttributeValueService } from './product-attribute-value.service';
import { ProductAttributeValueController } from './product-attribute-value.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { Product } from '../product/entities/product.entity';
import { AttributeValue } from '../attributes/attribute-value/entities/attribute-value.entity';
import { Attribute } from '../attributes/attribute/entities/attribute.entity';
import { ProductCacheService } from '../product/cache';
import { CatalogCacheService } from '../catalogs/cache';

@Module({
  imports: [TypeOrmModule.forFeature([ProductAttributeValue, Product, Attribute, AttributeValue])],
  controllers: [ProductAttributeValueController],
  providers: [ProductAttributeValueService, ProductCacheService, CatalogCacheService],
})
export class ProductAttributeValueModule { }
