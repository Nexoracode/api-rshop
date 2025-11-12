import { Brand } from "src/modules/brand/entities/brand.entity";
import { Category } from "src/modules/category/entities/category.entity";
import { Media } from "src/modules/media/entities/image.entity";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";

export interface CatalogProduct {
    id: number;
    name: string;
    price: number;
    discountAmount: number;
    discountPercent: number;
    finalPrice: number;
    stock: number;
    isFeautered?: boolean;
    hasVariants: boolean;
    isSameDayShipping: boolean;
    medias: [] | null,
    category: Category | null;
    mediaPinned?: Media | null;
    brand?: Brand | null;
    variants: VariantProduct[] | [] | null;
}
