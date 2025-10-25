import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogCacheService } from './services/catalog-cache.service';
import { CatalogQueryService } from './services/catalog-query.service';

// Entities
import { Category } from '../category/entities/category.entity';
import { Brand } from '../brand/entities/brand.entity';
import { Product } from '../product/entities/product.entity';

// Mapper
import { CatalogMapper } from './mappers/catalog.mapper';
import { CacheModule } from '@nestjs/cache-manager';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogSearchService } from './services/catalog-search.service';

@Module({
    imports: [
        // TypeORM entities used in queries
        TypeOrmModule.forFeature([Category, Brand, Product]),

        // Global cache for smartSearch results
        CacheModule.register({
            isGlobal: false,
            ttl: 300, // default TTL 5 min
        }),
    ],
    controllers: [CatalogController],
    providers: [
        CatalogService,
        CatalogCacheService,
        CatalogQueryService,
        CatalogSearchService,
        CatalogMapper,
    ],
    exports: [
        CatalogService, // export if other modules (e.g., product page) need it
    ],
})
export class CatalogModule { }
