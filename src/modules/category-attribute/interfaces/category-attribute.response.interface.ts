import { AttributeUnit } from "src/common/enums/attribute.enum";
import { Attribute } from "src/modules/attributes/attribute/entities/attribute.entity";
import { Category } from "src/modules/category/entities/category.entity";

export interface ICategoryAttributeResponse {
    id: number;
    category: Category;
    attribute: IAttributeRes;
}

interface IAttributeRes {
    id: number;
    name: string;
    type: AttributeUnit,
    groupId: number;
    groupName: string;
    values: IAttributeValueRes[]
}

interface IAttributeValueRes {
    id: number;
    value: string;
}