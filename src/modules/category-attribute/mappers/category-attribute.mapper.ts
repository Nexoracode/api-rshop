import { CategoryAttribute } from "../entities/category-attribute.entity";
import { ICategoryAttributeResponse } from "../interfaces/category-attribute.response.interface";

export class CategoryAttributeMapper {
    static toResponse(entity: CategoryAttribute): ICategoryAttributeResponse {
        return {
            id: entity.id,
            categoryName: entity.category.title,
            category: entity.category,
            attributeName: entity.attribute.name,
            attribute: entity.attribute,
        }
    }
}