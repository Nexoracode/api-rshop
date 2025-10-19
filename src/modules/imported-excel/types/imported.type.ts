import { WeightUnit } from "src/common/enums/product.enum";

export type ExcelRow = {
    name: string;
    price: string;
    stock: string;
    isSameDayShipping: boolean;
    requiresPreparation: boolean;
    preparationDays: number;
    isLimitedStock: boolean;
    discountAmount: number;
    discountPrecent: number;
    isFeatured: boolean;
    weightUnit: WeightUnit;
    description: string;
    isVisible: boolean;
    orderLimit: number;
    category: string;
    categorySlug: string;
    categoryDiscount: number;
    mainCategory: number;
    attributes: []
}