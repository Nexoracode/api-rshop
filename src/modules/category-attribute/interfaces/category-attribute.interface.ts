import { Attribute } from "src/modules/attributes/attribute/entities/attribute.entity";
export interface ICategoryAttribute {
    id: number;
    attribute: Attribute;
    attributeId: number;
    isRequired: boolean | false;
}