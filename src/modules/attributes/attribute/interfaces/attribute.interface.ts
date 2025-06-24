import { ICategory } from "src/modules/category/interfaces/category.interface";
import { AttributeValue } from "../../attribute-value/entities/attribute-value.entity";
import { AttributeUnit } from "src/common/enums/attribute.enum";
import { Column } from "typeorm";
import { AttributeGroup } from "../../attribute-group/entities/attribute-group.entity";
import { CategoryAttribute } from "src/modules/category-attribute/entities/category-attribute.entity";

export interface IAttribute {
    id: number;
    name: string;
    slug?: string | null;
    isPublic: boolean;
    group: AttributeGroup;
    groupid?: number | null;
    values: AttributeValue[],
    catAttribute: CategoryAttribute[];
    type: AttributeUnit,
    displayOrder?: number;
    isVariant: boolean | false;
}