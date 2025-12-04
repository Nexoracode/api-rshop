import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { Product } from '../product/entities/product.entity';
import { Category } from '../category/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category])
  ],
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService]
})
export class SeoModule { }
