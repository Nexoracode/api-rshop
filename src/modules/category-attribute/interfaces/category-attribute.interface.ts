import { Attribute } from "src/modules/attributes/attribute/entities/attribute.entity";
import { Category } from "src/modules/category/entities/category.entity";

export interface ICategoryAttribute {
    id: number;
    category: Category;
    categoryId: number;
    attribute: Attribute;
    attributeId: number;
    isRequired: boolean | false;
}