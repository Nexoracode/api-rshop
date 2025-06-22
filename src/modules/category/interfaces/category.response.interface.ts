import { Media } from "src/modules/media/entities/image.entity";
import { Category } from "../entities/category.entity";

export interface ICategoryResponse {
    children: ICategoryResponse[];
    discount: string;
    id: number;
    level: number;
    parent?: number | null;
    isDelete: boolean;
    title: string;
    slug: string;
    media: Media,
}