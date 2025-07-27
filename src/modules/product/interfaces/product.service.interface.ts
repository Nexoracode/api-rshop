import { Paginated, PaginateQuery } from "nestjs-paginate";
import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { IProductResponse } from "./product.response";
import { Product } from "../entities/product.entity";

export interface IProductService {
    create(data: CreateProductDto): Promise<IProductResponse>;
    update(id: number, data: UpdateProductDto): Promise<IProductResponse>
    findAll(query: PaginateQuery): Promise<Object>;
    findOne(id: number): Promise<IProductResponse>;
    remove(id: number): Promise<Object>;
    sepidar(): Promise<Object>;
}