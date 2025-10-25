import { Category } from '../../category/entities/category.entity';

export const extractCategoryIds = (category: Category): number[] => {
    const ids = [category.id];
    if (category.children?.length) {
        for (const child of category.children) {
            ids.push(...extractCategoryIds(child));
        }
    }
    return ids;
};
