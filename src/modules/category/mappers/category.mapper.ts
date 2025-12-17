import { Category } from "../entities/category.entity";
import { ICategoryResponse, ICategoryResponseSite } from "../interfaces/category.response.interface";

export class CategoryMapper {
    /**
     * تبدیل یک دسته‌بندی به فرمت خروجی
     */
    static toResponse(category: Category): ICategoryResponse {
        return {
            id: category.id,
            title: category.title,
            slug: category.slug,
            discount: category.discount,
            level: category.level,
            isActive: category.isActive,
            parentId: category.parent?.id || 0,
            isDelete: !category.children || category.children.length === 0,
            children: category.children?.map((child) => this.toResponse(child)) ?? [],
            media: category.media ?? null,
            products: category.products || [],
        };
    }

    /**
     * تبدیل لیست دسته‌بندی‌ها به فرمت خروجی (برای Tree)
     */
    static toResponseList(categories: Category[]): ICategoryResponse[] {
        return categories.map((category) => this.toResponse(category));
    }

    /**
     * تبدیل یک دسته‌بندی به فرمت خروجی با تمام فرزندان (descendants)
     */
    static toResponseWithDescendants(category: Category): ICategoryResponse {
        return this.toResponse(category);
    }

    /**
     * تبدیل یک دسته‌بندی به فرمت خروجی سایت
     */
    static toResponseSite(category: Category): ICategoryResponseSite {
        return {
            id: category.id,
            title: category.title,
            slug: category.slug,
            level: category.level,
            isActive: category.isActive,
            parentId: category.parent?.id || 0,
            children: category.children?.map((child) => this.toResponseSite(child)) ?? [],
        };
    }

    /**
     * تبدیل لیست دسته‌بندی‌ها به فرمت خروجی سایت (برای Tree)
     */
    static toResponseSiteList(categories: Category[]): ICategoryResponseSite[] {
        return categories.map((category) => this.toResponseSite(category));
    }
}