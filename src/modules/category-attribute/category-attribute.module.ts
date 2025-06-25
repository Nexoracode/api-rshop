import { Module } from '@nestjs/common';
import { CategoryAttributeService } from './category-attribute.service';
import { CategoryAttributeController } from './category-attribute.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryAttribute } from './entities/category-attribute.entity';
import { Attribute } from '../attributes/attribute/entities/attribute.entity';
import { Category } from '../category/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryAttribute, Attribute, Category])
  ],
  controllers: [CategoryAttributeController],
  providers: [CategoryAttributeService],
  exports: [CategoryAttributeService]
})
export class CategoryAttributeModule { }
