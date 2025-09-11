export interface IVariantOptionResponse {
    option: {
        id: number;
        is_active: boolean;   // از value.isActive می‌گیریم
        created_at: string | null;   // نداریم → null
        modified_at: string | null;  // نداریم → null
        name: string;
        is_color: boolean;    // از attribute.type === 'color'
    };
    value: string;          // AttributeValue.value
    id: number;             // AttributeValue.id
    color_code: string;     // AttributeValue.displayColor || ""
}

export interface IVariantShopResponse {
    id: number;
    name: string;
    barcode: string;
    sku: string;
    time_delay: number;
    cost: number;
    primary_cost: number;
    margin_cost: number;
    is_unlimited: boolean;
    stock: number;
    note: string;
    max_quantity: number;
    stock_alert: number;
    status: number;
    vendor: string;
    option_values: IVariantOptionResponse[];
    cost_expired_at: string | null;
    weight: number;
    merchant_inventory_id: number | null;
    same_day_delivery: boolean;
    discount_type: 1 | 2 | 0; // 1: درصدی، 2: مبلغی، 0: بدون تخفیف
    discount_amount: number;
    pre_order_enable: boolean;
    gold_pricing: unknown | null;
    images: { id: number; url: string; type: string }[];
}
