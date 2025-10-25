import { Brand } from "src/modules/brand/entities/brand.entity";
import { Category } from "src/modules/category/entities/category.entity";
import { Media } from "src/modules/media/entities/image.entity";

export interface CatalogProduct {
    id: number;
    name: string;
    price: number;
    discountAmount: number;
    discountPrecent: number;
    medias: [] | null,
    isSameDayShipping: boolean,
    category: Category | null;
    brand?: Brand | null
}
