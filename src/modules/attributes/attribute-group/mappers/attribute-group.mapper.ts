import { AttributeGroup } from "../entities/attribute-group.entity";
import { IAttributeGroupResponse } from "../interfaces/attribute-group.response.interface";

export class AttributeGroupMapper {
    static toResponse(entity: AttributeGroup): IAttributeGroupResponse {
        return {
            id: entity.id,
            name: entity.name,
            slug: entity.slug!,
            displayOrder: entity.displayOrder!,
            attributes: entity.attributes,
        }
    }
}