import { Media } from "src/modules/media/entities/image.entity";
import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";
import { WeightUnit } from "src/common/enums/product.enum";
import { ICategory } from "src/modules/category/interfaces/category.interface";
import { HelperEntity } from "src/modules/helper/entities/helper.entity";
import { Brand } from "src/modules/brand/entities/brand.entity";
import { AttributeUnit } from "src/common/enums/attribute.enum";
import { Product } from "../entities/product.entity";
import { IVariantAttributeValue } from "src/modules/attributes/variant-attribute-value/interfaces/variant-attribute-value.interface";

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
    brand: Brand | null;
    brandId: number;
    helper: HelperEntity | null;
    helperId: number;
    createdAt?: Date;
    orderLimit?: number;
    updatedAt?: Date;
    variants: IVariantProduct[] | null
}

export interface IVariantProduct {
    id: number;
    stock: number;
    price: number;
    isActive?: boolean | true;
    product: Product;
    productId: number;
    sku: string;
    attributes: IVariantAttributeValue[];
    name: string;
}

interface IVariants {
    group: IGroupResponse | null,
    groupId: number | null;
    type: AttributeUnit;
    slug: string;
    displayOrder: number;
    isPublic: boolean;
    isVariant: boolean;
    name: string;
    values: IAttributeValue[] | []
}

interface IAttributeValue {
    id: number;
    displayOrder: number;
    displayColor: string;
    isActive: boolean;
    value: string;
    attributeId: number;

}

interface IGroupResponse {
    displayOrder: number;
    id: number;
    name: string;
    slug: string;
}

interface IMediaResponse {
    id: number;
    url: string;
    type: string;
}