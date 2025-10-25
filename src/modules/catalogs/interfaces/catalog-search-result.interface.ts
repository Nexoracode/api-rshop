import { CatalogProduct } from './catalog-product.interface';
import { CatalogGroup } from './catalog-group.interface';

export interface CatalogSearchResult {
    products: CatalogProduct[];
    groupedByCategory: CatalogGroup<{ id: number; title: string; slug: string }>[];
    groupedByBrand: CatalogGroup<{ id: number; name: string; slug: string; logo?: string }>[];
    totalCount: number;
}
