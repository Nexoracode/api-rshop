import { Module } from '@nestjs/common';
import { AttributeGroupService } from './attribute-group.service';
import { AttributeGroupController } from './attribute-group.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeGroup } from './entities/attribute-group.entity';
import { AttributeService } from '../attribute/attribute.service';
import { CategoryModule } from 'src/modules/category/category.module';
import { ProductCacheService } from 'src/modules/product/cache';
import { CatalogCacheService } from 'src/modules/catalogs/cache';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeGroup]), CategoryModule],
  controllers: [AttributeGroupController],
  providers: [AttributeGroupService, ProductCacheService, CatalogCacheService],
  exports: [AttributeGroupService]
})
export class AttributeGroupModule { }
