import { Promotion } from '../entities/promotion.entity';
import { OrderPreview } from './promotion-repository.interface';

export abstract class PromotionValidator {
    abstract isValid(order: OrderPreview, promotion: Promotion): Promise<boolean>;
}