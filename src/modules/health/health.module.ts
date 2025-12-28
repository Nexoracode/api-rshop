// health.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CategoryCacheService } from '../category/cache';
import { ProductCacheService } from '../product/cache';
import { HomePageCacheService } from '../home-page/cache';
import { CollectionCacheService } from '../collection/cache/collection-cache.service';
import { OrderCacheService } from '../order/cache/order-cache.service';
import { CatalogCacheService } from '../catalogs/cache';

@Module({
    providers: [CategoryCacheService, ProductCacheService, HomePageCacheService, CollectionCacheService, OrderCacheService, CatalogCacheService],
    controllers: [HealthController],
})
export class HealthModule { }