import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { IProductResponse } from "./product.response";

export interface IProductService {
    create(data: CreateProductDto): Promise<IProductResponse>;
    update(id: number, data: UpdateProductDto): Promise<IProductResponse>
    findOne(id: number): Promise<IProductResponse>;
}