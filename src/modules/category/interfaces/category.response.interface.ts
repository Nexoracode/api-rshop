import { Media } from "src/modules/media/entities/image.entity";
import { Category } from "../entities/category.entity";
import { Product } from "src/modules/product/entities/product.entity";

export interface ICategoryResponse {
    children: ICategoryResponse[];
    discount: string;
    id: number;
    level: number;
    parentId?: number;
    isDelete: boolean;
    title: string;
    slug: string;
    media: Media | Object,
    products: Product[]
}

export interface ICategoryResponseSite {
    children: ICategoryResponseSite[];
    id: number;
    level: number;
    parentId?: number;
    title: string;
    slug: string;
}