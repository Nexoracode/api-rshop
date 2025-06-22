import { AttributeValue } from "src/modules/attributes/attribute-value/entities/attribute-value.entity";
import { Category } from "src/modules/category/entities/category.entity";
import { Media } from "src/modules/media/entities/image.entity";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";

export interface IProduct {
    id: number;
    name: string;
    price: number;
    stock: number;
    isSameDayShipping: boolean | false;
    requiresPreparation: boolean | false;
    preparationDays?: number | null;
    isLimitedStock: boolean | false;
    discountAmount?: number | null;
    discountPercent?: number | null;
    isFeatured: boolean | false;
    weight: number;
    description?: string | null;
    isVisible: boolean | false;
    category: Category;
    categoryId: number;
    media: Media[],
    attributes: AttributeValue[],
    variants: VariantProduct[]
}