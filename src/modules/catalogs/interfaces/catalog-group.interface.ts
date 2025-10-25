import { CatalogProduct } from './catalog-product.interface';

export interface CatalogGroup<T> {
    item: T;
    count: number;
    products: CatalogProduct[];
}
