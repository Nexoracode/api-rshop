import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { MediaModule } from '../media/media.module';
import { Media } from '../media/entities/image.entity';
import { UploadService } from 'src/common/services/upload.service';
import { SeoModule } from '../seo/seo.module';
import { CategoryCacheService } from './cache/category-cache.service'; // ✅ اضافه شد

@Module({
  imports: [TypeOrmModule.forFeature([Category, Media]), MediaModule, SeoModule],
  controllers: [CategoryController],
  providers: [
    CategoryService, 
    UploadService,
    CategoryCacheService, // ✅ اضافه شد
  ],
  exports: [CategoryService]
})
export class CategoryModule { }
