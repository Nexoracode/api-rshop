import { AttributeGroup } from "../../attribute-group/entities/attribute-group.entity";

export interface IAttributeResponse {
    id: number;
    isPublic?: boolean;
    group: AttributeGroup,
    groupId?: number;
    isVariant: boolean | false;
}