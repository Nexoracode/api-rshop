import { Icon } from "src/modules/icon/entities/icon.entity";
import { Media } from "src/modules/media/entities/image.entity";
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
    isActive: boolean;
    media: Media | null;
    icon: {
        id: number,
        name: string;
        svg: string;
    } | null;
    products: Product[];
}

export interface ICategoryResponseSite {
    children: ICategoryResponseSite[];
    id: number;
    level: number;
    parentId?: number;
    title: string;
    slug: string;
    isActive?: boolean;
    icon: {
        id: number,
        name: string;
        svg: string;
    } | null;
}
