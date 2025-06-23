import { Category } from "src/modules/category/entities/category.entity";
import { Attribute } from "../../attribute/entities/attribute.entity";

export interface IAttributeGroup {
    id: number;
    name: string;
    slug?: string;
    displayOrder?: number;
    attributes: Attribute[]
}