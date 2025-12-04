import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { CategoryModule } from '../category/category.module';
import { VariantAttributeValueModule } from '../attributes/variant-attribute-value/variant-attribute-value.module';
import { MediaModule } from '../media/media.module';
import { UploadService } from 'src/common/services/upload.service';
import { Review } from '../review/entities/review.entity';
import { SeoModule } from '../seo/seo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Review]),
    CategoryModule,
    VariantAttributeValueModule,
    MediaModule,
    SeoModule,
  ],
  providers: [ProductService, UploadService],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule { }
