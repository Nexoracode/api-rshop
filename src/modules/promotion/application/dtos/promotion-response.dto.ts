import { PromotionType } from '../../domain/enums/promotion-type.enum';

export class PromotionResponseDto {
    id: number;
    name: string;
    type: PromotionType;
    code?: string | null;
    startsAt: Date;
    endsAt: Date;
    isActive: boolean;
}