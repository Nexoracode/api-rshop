import { Media } from "src/modules/media/entities/image.entity";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";
import { WeightUnit } from "src/common/enums/product.enum";
import { ICategory } from "src/modules/category/interfaces/category.interface";
import { HelperEntity } from "src/modules/helper/entities/helper.entity";
import { Brand } from "src/modules/brand/entities/brand.entity";

export interface IProductResponse {
    id: number;
    name: string;
    price: number;
    stock: number;
    isLimitedStock: boolean;
    discountAmount?: number | null;
    discountPercent?: number | null;
    isFeatured: boolean;
    weight: number;
    weightUnit: WeightUnit,
    description?: string | null;
    isVisible: boolean;
    category: ICategory;
    categoryId: number;
    medias: IMediaResponse[];
    mediaPinned?: IMediaResponse | null,
    mediaPinnedId?: number;
    variants: VariantProduct[];
    brand: Brand | null;
    brandId: number;
    helper: HelperEntity | null;
    helperId: number;
    createdAt?: Date;
    orderLimit?: number;
    updatedAt?: Date;
}

interface IMediaResponse {
    id: number;
    url: string;
    type: string;
}