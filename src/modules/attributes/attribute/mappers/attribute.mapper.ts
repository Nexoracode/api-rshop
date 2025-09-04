import { Attribute } from "../entities/attribute.entity";
import { IAttributeResponse, IAttributeResponseGrouped } from "../interfaces/attribute.response.interface";

export class AttributeMapper {
    static toResponseGrouped(attribute: Attribute): IAttributeResponseGrouped {
        return {
            id: attribute.id,
            isPublic: attribute.isPublic,
            name: attribute.name,
            slug: attribute.slug ?? null,
            type: attribute.type,
            group: attribute.group,
            groupId: attribute.groupId!,
            isVariant: attribute.isVariant,
            displayOrder: attribute.displayOrder,
        }
    }

    static toResponse(attribute: Attribute): IAttributeResponse {
        return {
            id: attribute.id,
            isPublic: attribute.isPublic,
            name: attribute.name,
            slug: attribute.slug ?? null,
            type: attribute.type,
            groupId: attribute.groupId!,
            isVariant: attribute.isVariant,
            displayOrder: attribute.displayOrder,
        }
    }
}