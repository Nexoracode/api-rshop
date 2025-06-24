import { Attribute } from "../../attribute/entities/attribute.entity";

export interface IAttributeGroupResponse {
    id: number;
    name: string;
    slug: string;
    displayOrder: number;
    attributes: Attribute[]
}