export interface IGroupedVariantProductResponse {
    id: number;
    sku: string;
    stock: number;
    price: number;
    groups: {
        groupId: number | null,
        groupName: string,
        attributes: {
            attributeId: number,
            attributeName: string,
            valueId: number,
            value: string,
            label: string,
        }[];
    }[];
}

export interface IVariantAttributeValueResponse {
    attributeId: number;
    attributeName: string;
    valueId: number;
    value: string;
    label: string;
    isVariant: boolean;
}

export interface IVariantProductGroupedResponse {
    id: number;
    sku: string;
    stock: number;
    price: number;
    attributes: IVariantAttributeValueResponse[];
}