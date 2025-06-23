import { CreateVariantProductDto } from "../dto/create-variant-product.dto";
import { UpdateVariantProductDto } from "../dto/update-variant-product.dto";
import { IVariantProductGroupedResponse } from "./variant-product.response.interface";

export interface IVariantProductService {
    create(data: CreateVariantProductDto);
    findAll(): Promise<IVariantProductGroupedResponse[]>;
    findOne(id: number): Promise<IVariantProductGroupedResponse>;
    remove(id: number): Promise<string>;
    update(id: number, data: UpdateVariantProductDto): Promise<IVariantProductGroupedResponse>;
}