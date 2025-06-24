import { Attribute } from "../../attribute/entities/attribute.entity";
import { IAttributeValue } from "./attribute-value.interface";

export interface IAttributeValueResponse {
    id: number;
    value: string;
    attribute: Attribute;
    attributeId: number;
    displayColor?: string | undefined;
    displayOrder: number;
    isActive: boolean;
}