import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { Product } from '../product/entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { CategoryAttribute } from '../category-attribute/entities/category-attribute.entity';
import { Brand } from '../brand/entities/brand.entity';

@Module({
    imports: [
        // TypeORM Entities
        TypeOrmModule.forFeature([
            Product,
            Category,
            CategoryAttribute,
            Brand,
        ]),

        // 💾 Cache Configuration
        // گزینه 1: In-Memory Cache (ساده)
        CacheModule.register({
            ttl: 300, // 5 minutes
            max: 1000, // max 1000 items in cache
        }),

        // گزینه 2: Redis Cache (Production - uncomment اگه Redis داری)
        // CacheModule.register({
        //   store: require('cache-manager-redis-store'),
        //   host: process.env.REDIS_HOST || 'localhost',
        //   port: parseInt(process.env.REDIS_PORT) || 6379,
        //   password: process.env.REDIS_PASSWORD,
        //   ttl: 300,
        //   max: 10000,
        // }),

        // 🚦 Rate Limiting
        ThrottlerModule.forRoot([{
            ttl: 60000,  // 60 seconds
            limit: 20,   // 20 requests per 60 seconds
        }]),
    ],
    controllers: [CatalogController],
    providers: [CatalogService],
    exports: [CatalogService],
})
export class CatalogModule { }