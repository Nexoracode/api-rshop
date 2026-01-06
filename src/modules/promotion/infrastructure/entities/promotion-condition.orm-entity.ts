import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { PromotionOrmEntity } from './promotion.orm-entity';
import { ConditionType } from '../../domain/enums/condition-type.enum';

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

    @Column({ name: 'user_ids', type: 'json', nullable: true })
    userIds: number[] | null;

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
