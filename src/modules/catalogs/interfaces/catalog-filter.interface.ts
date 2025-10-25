export interface CatalogFilter {
    category: {
        id: number;
        title: string;
        slug: string;
    };
    brands: { id: number; name: string }[];
    attributes: {
        id: number;
        title: string;
        type: string;
        values: string[];
    }[];
    priceRange: {
        min: number;
        max: number;
    } | null;
}
