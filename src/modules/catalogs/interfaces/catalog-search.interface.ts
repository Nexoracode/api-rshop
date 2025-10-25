export interface CatalogSearchSuggestion {
    term: string;
    suggestions: string[];
}

export interface CatalogSearchResult {
    term: string;
    products: Array<{
        id: number;
        name: string;
        price: number;
        finalPrice: number;
        brand?: { id: number; name: string };
        category?: { id: number; title: string };
        image?: string | null;
    }>;
    categories: Array<{ id: number; title: string }>;
    brands: Array<{ id: number; name: string }>;
}
