import { Attribute } from "src/modules/attributes/attribute/entities/attribute.entity";
import { Category } from "src/modules/category/entities/category.entity";

export interface ICategoryAttributeResponse {
    id: number;
    attributeName: string;
    categoryName: string;
    category: Category
    attribute: Attribute
}