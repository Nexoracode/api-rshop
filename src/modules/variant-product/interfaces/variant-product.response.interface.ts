export interface IVariantProductResponse {
    id: number;
    sku: string;
    price: number;
    stock: number;
    productId: number;
    attributes: {
        attributeId: number;
        valueId: number;
        label: string;
    }[];
}

export interface IVariantProductGroupedResponse {
    id: number;
    sku: string;
    price: number;
    stock: number;
    productId: number;
    variants: VariantGroup[];
}

export interface VariantGroup {
    groupName: string;
    items: VariantGroupItem[];
}

export interface VariantGroupItem {
    attribute: string;
    value: string;
    label: string;
}
