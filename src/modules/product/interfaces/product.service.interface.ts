import { Paginated, PaginateQuery } from "nestjs-paginate";
import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { IProductResponse } from "./product.response";
import { Product } from "../entities/product.entity";

export interface IProductService {
    create(data: CreateProductDto): Promise<IProductResponse>;
    update(id: number, data: UpdateProductDto): Promise<IProductResponse>
    findOne(id: number): Promise<IProductResponse>;
    findByCategoryTitle(categoryTitle: string, query: PaginateQuery): Promise<Paginated<Product>>;
    remove(id: number): Promise<Object>;
}