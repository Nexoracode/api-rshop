import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { MediaModule } from '../media/media.module';
import { UploadService } from 'src/common/services/upload.service';
import { CatalogModule } from '../catalogs/catalog.module';

@Module({
  imports: [TypeOrmModule.forFeature([Brand]), MediaModule, CatalogModule],
  controllers: [BrandController],
  providers: [BrandService, UploadService],
})
export class BrandModule { }
