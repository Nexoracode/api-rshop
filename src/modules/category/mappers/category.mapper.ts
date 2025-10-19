import { Category } from "../entities/category.entity";
import { ICategoryResponse, ICategoryResponseSite } from "../interfaces/category.response.interface";

export class CategoryMapper {
    static toResponse(category: Category): ICategoryResponse {
        return {
            id: category.id,
            title: category.title,
            slug: category.slug,
            discount: category.discount,
            level: category.level,
            parentId: category.parent?.id || 0,
            children: category.children?.map((child) => this.toResponse(child)) ?? [],
            isDelete: !category.children || category.children.length === 0,
            media: category.media ?? null,
            products: category.products || [],
        };
    }

    static toResponseSite(category: Category): ICategoryResponseSite {
        return {
            id: category.id,
            title: category.title,
            slug: category.slug,
            level: category.level,
            parentId: category.parent?.id || 0,
            children: category.children?.map((child) => this.toResponseSite(child)) ?? [],
        };
    }
}