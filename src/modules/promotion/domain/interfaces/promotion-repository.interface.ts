import { Promotion } from '../entities/promotion.entity';

export abstract class PromotionRepository {
    abstract findById(id: number): Promise<Promotion | null>;
    abstract findActiveByCode(code: string): Promise<Promotion | null>;
    abstract findActiveForOrder(order: OrderPreview): Promise<Promotion[]>;
    abstract create(promotion: Promotion): Promise<Promotion>;
    abstract update(id: number, promotion: Promotion): Promise<Promotion>;
    abstract delete(id: number): Promise<void>;
    abstract paginate(params: {
        page: number;
        limit: number;
    }): Promise<{ items: Promotion[]; total: number }>;
}

// یک نوع ساده برای preview سفارش (برای check promo)
export interface OrderPreview {
    userId: number;
    isFirstOrder: boolean;
    items: {
        productId: number;
        categoryId?: number;
        quantity: number;
        unitPrice: number;
    }[];
    subtotal: number;
    shippingCost: number;
}