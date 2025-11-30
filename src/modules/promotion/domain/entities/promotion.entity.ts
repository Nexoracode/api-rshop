import { Product } from 'src/modules/product/entities/product.entity';
import { PromotionType } from '../enums/promotion-type.enum';
import { PromotionAction } from './promotion-action.entity';
import { PromotionCondition } from './promotion-confition.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Category } from 'src/modules/category/entities/category.entity';

export class Promotion {
    id?: number;
    name: string;
    type: PromotionType;
    code?: string | null;

    startsAt: Date;
    endsAt: Date;

    usageLimit?: number | null;
    usedCount: number;

    isActive: boolean;

    conditions: PromotionCondition[];
    actions: PromotionAction[];

    products: Product[];
    user: User[];
    categories: Category[];

    constructor(partial: Partial<Promotion>) {
        Object.assign(this, partial);
    }
}