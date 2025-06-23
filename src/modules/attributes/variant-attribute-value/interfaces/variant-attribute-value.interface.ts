import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";
import { Attribute } from "../../attribute/entities/attribute.entity";
import { AttributeValue } from "../../attribute-value/entities/attribute-value.entity";

export interface IVariantAttributeValue {
    id: number;
    variant: VariantProduct;
    variantId: number;
    attribute: Attribute,
    attributeId: number;
    value: AttributeValue,
    valueId: number;
    label?: string;
}