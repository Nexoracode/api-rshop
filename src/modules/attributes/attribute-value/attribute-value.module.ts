import { Module } from '@nestjs/common';
import { AttributeValueService } from './attribute-value.service';
import { AttributeValueController } from './attribute-value.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeValue } from './entities/attribute-value.entity';
import { AttributeModule } from '../attribute/attribute.module';
import { Attribute } from '../attribute/entities/attribute.entity';
import { ProductCacheService } from 'src/modules/product/cache';
import { CatalogCacheService } from 'src/modules/catalogs/cache';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeValue, Attribute])],
  controllers: [AttributeValueController],
  providers: [AttributeValueService, ProductCacheService, CatalogCacheService],
  exports: [AttributeValueService]
})
export class AttributeValueModule { }
