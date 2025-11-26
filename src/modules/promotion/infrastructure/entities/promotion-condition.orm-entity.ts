import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { PromotionOrmEntity } from './promotion.orm-entity';
import { ConditionType } from '../../domain/enums/confition-type.enum';

@Entity('promotion_conditions')
export class PromotionConditionOrmEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => PromotionOrmEntity, (promotion) => promotion.conditions, {
        onDelete: 'CASCADE',
    })
    promotion: PromotionOrmEntity;

    @Column({ name: 'type', type: 'enum', enum: ConditionType })
    type: ConditionType;

    @Column({ name: 'user_id', type: 'int', nullable: true })
    userId: number | null;

    // ✅ ساختار جدید products: [{ productId, variantIds? }, ...]
    @Column({ name: 'products', type: 'json', nullable: true })
    products:
        | {
            productId: number;
            variantIds?: number[];
        }[]
        | null;

    @Column({ name: 'category_ids', type: 'json', nullable: true })
    categoryIds: number[] | null;

    @Column({
        name: 'min_amount',
        type: 'decimal',
        precision: 15,
        scale: 2,
        nullable: true,
    })
    minAmount: string | null;
}
