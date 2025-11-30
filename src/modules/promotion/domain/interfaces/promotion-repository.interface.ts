import { PaginateQuery } from 'nestjs-paginate';
import { Promotion } from '../entities/promotion.entity';

export abstract class PromotionRepository {
    abstract findById(id: number): Promise<Promotion | null>;
    abstract findActiveByCode(code: string): Promise<Promotion | null>;
    abstract findActiveForOrder(order: OrderPreview): Promise<Promotion[]>;
    abstract create(promotion: Promotion): Promise<Promotion>;
    abstract update(id: number, promotion: Promotion): Promise<Promotion>;
    abstract delete(id: number): Promise<void>;
    abstract paginated(query: PaginateQuery): Promise<any>;
}

// یک نوع ساده برای preview سفارش (برای check promo)
export interface OrderPreview {
    userId: number;
    isFirstOrder: boolean;   // 🔥 باید وجود داشته باشد
    subtotal: number;
    items: {
        productId: number;
        variantId?: number;
        categoryId?: number;
        quantity: number;
        unitPrice: number;
    }[];
}

