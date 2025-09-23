import { Category } from "../entities/category.entity";
import { ICategoryResponse } from "../interfaces/category.response.interface";

export class CategoryMapper {
    static toResponse(category: Category): ICategoryResponse {
        return {
            id: category.id,
            title: category.title,
            slug: category.slug,
            discount: category.discount,
            level: category.level,
            parentId: category.parent ? category.parent.id : 0,
            children: category.children?.map((child) => this.toResponse(child)) ?? [],
            isDelete: !category.children || category.children.length === 0,
            media: category.media,
            products: category.products,
        };
    }
}