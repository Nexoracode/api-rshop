import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { MediaModule } from '../media/media.module';
import { Media } from '../media/entities/image.entity';
import { UploadService } from 'src/common/services/upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Media]), MediaModule],
  controllers: [CategoryController],
  providers: [CategoryService, UploadService],
  exports: [CategoryService]
})
export class CategoryModule { }
