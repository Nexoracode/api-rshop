import { CategoryAttribute } from "../entities/category-attribute.entity";
import { ICategoryAttributeResponse } from "../interfaces/category-attribute.response.interface";

export class CategoryAttributeMapper {
    static toResponse(entity: CategoryAttribute): ICategoryAttributeResponse {
        return {
            id: entity.id,
            category: entity.category,
            attribute: {
                id: entity.attribute.id,
                name: entity.attribute.name,
                type: entity.attribute.type,
                groupId: entity.attribute.group.id,
                groupName: entity.attribute.group.name,
                values: entity.attribute.values.map((value) => ({
                    id: value.id,
                    value: value.value,
                })),

            },
        }
    }
}