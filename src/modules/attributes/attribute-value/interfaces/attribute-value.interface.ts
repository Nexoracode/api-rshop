import { Attribute } from "../../attribute/entities/attribute.entity";

export interface IAttributeValue {
    id: number;
    value: string;
    attribute: Attribute,
    attributeId: number;
    displayColor?: string;
    isActive: boolean | true;
}