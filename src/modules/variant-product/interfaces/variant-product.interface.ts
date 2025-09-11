import { AttributeValue } from "src/modules/attributes/attribute-value/entities/attribute-value.entity";
import { VariantAttributeValue } from "src/modules/attributes/variant-attribute-value/entities/variant-attribute-value.entity";
import { IVariantAttributeValue } from "src/modules/attributes/variant-attribute-value/interfaces/variant-attribute-value.interface";
import { Product } from "src/modules/product/entities/product.entity";

export interface IVariantProduct {
    id: number;
    stock: number;
    price: number;
    isActive?: boolean | true;
    product: Product;
    productId: number;
    sku: string;
    attributes: IVariantAttributeValue[];
}