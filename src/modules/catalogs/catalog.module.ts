import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogCacheService } from './cache/catalog-cache.service'; // ✅ تغییر مسیر
import { CatalogQueryService } from './services/catalog-query.service';

// Entities
import { Category } from '../category/entities/category.entity';
import { Brand } from '../brand/entities/brand.entity';
import { Product } from '../product/entities/product.entity';

// Mapper
import { CatalogMapper } from './mappers/catalog.mapper';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogSearchService } from './services/catalog-search.service';

@Module({
    imports: [
        // TypeORM entities used in queries
        TypeOrmModule.forFeature([Category, Brand, Product]),
    ],
    controllers: [CatalogController],
    providers: [
        CatalogService,
        CatalogCacheService, // ✅ از cache/ directory
        CatalogQueryService,
        CatalogSearchService,
        CatalogMapper,
    ],
    exports: [
        CatalogService,
        CatalogCacheService, // ✅ export برای استفاده در Brand و Category
    ],
})
export class CatalogModule { }
