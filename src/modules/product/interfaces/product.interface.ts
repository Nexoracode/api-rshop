import { WeightUnit } from "src/common/enums/product.enum";
import { AttributeValue } from "src/modules/attributes/attribute-value/entities/attribute-value.entity";
import { Category } from "src/modules/category/entities/category.entity";
import { ICategory } from "src/modules/category/interfaces/category.interface";
import { HelperEntity } from "src/modules/helper/entites/helper.entity";
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
    weightUnit: WeightUnit,
    description?: string | null;
    isVisible: boolean | false;
    category: ICategory;
    categoryId: number;
    media: Media[],
    mediaPinned: Media;
    mediaPinnedId: number;
    variants: VariantProduct[]
    helper: HelperEntity | null
    orderLimit: number;
    createdAt?: Date;
    updatedAt?: Date;
}