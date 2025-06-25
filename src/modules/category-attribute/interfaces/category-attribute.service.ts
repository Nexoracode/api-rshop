import { CreateCategoryAttributeDto } from "../dto/create-category-attribute.dto";
import { UpdateCategoryAttribute } from "../dto/update-category-attribute.dto";
import { ICategoryAttributeResponse } from "./category-attribute.response.interface";

export interface ICategoryAttributeService {
    assign(data: CreateCategoryAttributeDto): Promise<ICategoryAttributeResponse>;
    update(id: number, data: UpdateCategoryAttribute): Promise<ICategoryAttributeResponse>;
    findByCategory(categoryId: number): Promise<ICategoryAttributeResponse>
}