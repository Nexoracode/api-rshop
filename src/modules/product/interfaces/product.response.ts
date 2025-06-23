import { AttributeValue } from "src/modules/attributes/attribute-value/entities/attribute-value.entity";
import { Category } from "src/modules/category/entities/category.entity";
import { Media } from "src/modules/media/entities/image.entity";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";
import { IProduct } from "./product.interface";
import { WeightUnit } from "src/common/enums/product.enum";
import { ICategory } from "src/modules/category/interfaces/category.interface";

export interface IProductResponse {
    id: number;
    name: string;
    price: number;
    stock: number;
    isLimitedStock: boolean;
    discountAmount?: number | null | undefined;
    discountPercent?: number | null | undefined;
    isFeatured: boolean;
    weight: number;
    weightUnit: WeightUnit,
    description?: string | null | undefined;
    isVisible: boolean;
    category: ICategory;
    categoryId: number;
    media: Media[];
    attributes: AttributeValue[];
    variants: VariantProduct[];
}