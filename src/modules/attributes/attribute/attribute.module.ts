import { forwardRef, Module } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { AttributeController } from './attribute.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from './entities/attribute.entity';
import { AttributeGroupModule } from '../attribute-group/attribute-group.module';
import { CategoryAttribute } from 'src/modules/category-attribute/entities/category-attribute.entity';
import { CategoryAttributeModule } from 'src/modules/category-attribute/category-attribute.module';
import { AttributeGroup } from '../attribute-group/entities/attribute-group.entity';
import { ProductCacheService } from 'src/modules/product/cache';
import { CatalogCacheService } from 'src/modules/catalogs/cache';

@Module({
  imports: [TypeOrmModule.forFeature([Attribute, AttributeGroup, CategoryAttribute])],
  controllers: [AttributeController],
  providers: [AttributeService, ProductCacheService, CatalogCacheService],
  exports: [AttributeService]
})
export class AttributeModule { }
