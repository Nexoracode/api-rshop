import { Module } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CollectionAdminController } from './collection.admin.controller';
import { CollectionPublicController } from './collection.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from './entities/collection.entity';
import { Product } from '../product/entities/product.entity';
import { CollectionCacheService } from './cache/collection-cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([Collection, Product])],
  controllers: [CollectionAdminController, CollectionPublicController],
  providers: [CollectionService, CollectionCacheService],
})
export class CollectionModule { }
