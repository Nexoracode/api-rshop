import { CatalogFilter } from './catalog-filter.interface';
import { CatalogProduct } from './catalog-product.interface';

export interface CatalogCategoryResult {
    data: CatalogProduct[];
    meta: {
        total: number;
        page: number;
        limit: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    filters: CatalogFilter;
}
