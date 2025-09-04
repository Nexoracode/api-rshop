import { AttributeUnit } from "src/common/enums/attribute.enum";
import { AttributeGroup } from "../../attribute-group/entities/attribute-group.entity";

export interface IAttributeResponseGrouped {
    id: number;
    name: string,
    slug?: string | null,
    type: AttributeUnit,
    isPublic?: boolean;
    group: AttributeGroup,
    groupId?: number;
    isVariant: boolean | false;
    displayOrder?: number;
}

export interface IAttributeResponse {
    id: number;
    name: string,
    slug?: string | null,
    type: AttributeUnit,
    isPublic?: boolean;
    groupId?: number;
    isVariant: boolean | false;
    displayOrder?: number;
}