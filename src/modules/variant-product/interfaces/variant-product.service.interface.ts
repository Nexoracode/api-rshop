import { CreateVariantProductDto } from "../dto/create-variant-product.dto";
import { UpdateVariantProductDto } from "../dto/update-variant-product.dto";
import { IGroupedVariantProductResponse, IVariantProductGroupedResponse } from "./variant-product.response.interface";

export interface IVariantProductService {
    create(data: CreateVariantProductDto): Promise<IGroupedVariantProductResponse>;
    findAllByProductId(productId: number): Promise<IGroupedVariantProductResponse[] | IVariantProductGroupedResponse[]>
    findOne(id: number): Promise<IGroupedVariantProductResponse | IVariantProductGroupedResponse>;
    remove(id: number): Promise<Object>;
    update(id: number, data: UpdateVariantProductDto): Promise<IGroupedVariantProductResponse>;
}