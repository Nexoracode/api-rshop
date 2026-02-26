import { Product } from "src/modules/product/entities/product.entity";
import { Category } from "../entities/category.entity";
import { CategoryAttribute } from "src/modules/category-attribute/entities/category-attribute.entity";
import { Media } from "src/modules/media/entities/image.entity";
import { Icon } from "src/modules/icon/entities/icon.entity";

export interface ICategory {
    id: number;
    title: string;
    slug: string;
    parent: Category | null;
    products: Product[];
    categoryAttributes: CategoryAttribute[];
    level: number;
    media: Media | null;
    icon: Icon | null
    discount: string;
    createdAt: Date;
    updatedAt: Date;
}