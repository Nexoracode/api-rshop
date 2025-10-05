// interfaces/product-attribute-value.response.ts
export interface IProductAttributeValueResponse {
    id: number;
    isImportant: boolean;
    attribute: {
        id: number;
        name: string;
        slug: string;
        type: string;
        isPublic: boolean;
        isVariant: boolean;
    };
    value: {
        id: number | null;
        value: string | null;
        displayColor?: string | null;
    } | null;
}
