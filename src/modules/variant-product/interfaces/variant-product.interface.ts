import { VariantAttributeValue } from "src/modules/attributes/variant-attribute-value/entities/variant-attribute-value.entity";
import { Product } from "src/modules/product/entities/product.entity";

export interface IVariantProduct {
    id: number;
    stock: number;
    price: number;
    isActive?: boolean | true;
    product: Product;
    productId: number;
    sku: string;
    attributes: VariantAttributeValue[];
}