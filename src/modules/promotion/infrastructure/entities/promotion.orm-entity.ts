import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { PromotionType } from '../../domain/enums/promotion-type.enum';
import { PromotionConditionOrmEntity } from './promotion-condition.orm-entity';
import { PromotionActionOrmEntity } from './promotion-action.orm-entity';

@Entity('promotions')
export class PromotionOrmEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'type', type: 'enum', enum: PromotionType })
    type: PromotionType;

    @Column({ name: 'code', type: 'varchar', length: 50, nullable: true })
    code: string | null;

    @Column({ name: 'starts_at', type: 'datetime' })
    startsAt: Date;

    @Column({ name: 'ends_at', type: 'datetime' })
    endsAt: Date;

    @Column({ name: 'usage_limit', type: 'int', nullable: true })
    usageLimit: number | null;

    @Column({ name: 'used_count', type: 'int', default: 0 })
    usedCount: number;

    @Column({ name: 'is_active', type: 'tinyint', default: 1 })
    isActive: boolean;

    @Column({ 
        name: 'max_discount_amount', 
        type: 'decimal', 
        precision: 15, 
        scale: 2, 
        nullable: true,
        comment: 'حداکثر مبلغ تخفیف قابل اعمال (سقف تخفیف)' 
    })
    maxDiscountAmount: number | null;

    @OneToMany(
        () => PromotionConditionOrmEntity,
        (condition) => condition.promotion,
        { cascade: true, eager: true },
    )
    conditions: PromotionConditionOrmEntity[];

    @OneToMany(
        () => PromotionActionOrmEntity,
        (action) => action.promotion,
        { cascade: true, eager: true },
    )
    actions: PromotionActionOrmEntity[];
}