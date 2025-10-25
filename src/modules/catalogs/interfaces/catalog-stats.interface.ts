export interface CatalogStats {
    totalProducts: number;
    categories: {
        id: number;
        title: string;
        slug: string;
        productCount: number;
    }[];
    brands: {
        id: number;
        name: string;
        slug: string;
        logo?: string;
        productCount: number;
    }[];
}
