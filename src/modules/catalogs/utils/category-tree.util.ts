// utils/category-tree.util.ts
import { Category } from '../../category/entities/category.entity';

/**
 * استخراج ID تمام کتگوری‌ها از یک درخت (شامل ریشه، فرزندان، نوه‌ها و ...)
 * @param categoryTree کتگوری فعلی به‌صورت درخت
 * @param includeParents آیا والدها هم در خروجی باشند؟ (اختیاری)
 * @returns number[]
 */
export function extractCategoryIds(
    categoryTree: Category,
    includeParents = false,
): number[] {
    const ids = new Set<number>();

    // ۱. تابع بازگشتی برای پیمایش درخت به پایین
    const traverseChildren = (node: Category) => {
        if (!node) return;
        ids.add(node.id);
        if (node.children && node.children.length > 0) {
            for (const child of node.children) traverseChildren(child);
        }
    };

    traverseChildren(categoryTree);

    // ۲. اگر نیاز به والدها هم داریم، از مسیر parent بالا بریم
    if (includeParents) {
        let parent = categoryTree.parent;
        while (parent) {
            ids.add(parent.id);
            parent = parent.parent;
        }
    }

    return Array.from(ids);
}
