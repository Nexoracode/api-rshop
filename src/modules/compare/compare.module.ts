import { Module } from '@nestjs/common';
import { CompareService } from './compare.service';
import { CompareController } from './compare.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompareProduct } from './entities/compare.entity';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CompareProduct, Product])],
  controllers: [CompareController],
  providers: [CompareService],
})
export class CompareModule { }
