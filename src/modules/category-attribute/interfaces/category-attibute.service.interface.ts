import { CreateCategoryAttributeDto } from "../dto/create-category-attribute.dto";
import { ICategoryAttributeResponse } from "./category-attribute.response.interface";

export interface ICategoryAttributeService {
    assign(data: CreateCategoryAttributeDto): Promise<ICategoryAttributeResponse>;
    findByAttribute(attributeId: number): Promise<ICategoryAttributeResponse[]>;
    findByCategory(categoryId: number): Promise<ICategoryAttributeResponse[]>
}