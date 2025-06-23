import { Attribute } from "../entities/attribute.entity";
import { IAttributeResponse } from "../interfaces/attribute.response.interface";

export class AttributeMapper {
    static toResponse(attribute: Attribute): IAttributeResponse {
        return {
            id: attribute.id,
            isPublic: attribute.isPublic,
            group: attribute.group,
            groupId: attribute.groupId,
            isVariant: attribute.isVariant
        }
    }
}