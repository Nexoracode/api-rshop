import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "../product/entities/product.entity";
import { Category } from "../category/entities/category.entity";
import { CategoryAttribute } from "../category-attribute/entities/category-attribute.entity";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";

@Module({
    imports: [TypeOrmModule.forFeature([Product, Category, CategoryAttribute])],
    controllers: [CatalogController],
    providers: [CatalogService],
    exports: [CatalogService],
})
export class CatalogModule { }