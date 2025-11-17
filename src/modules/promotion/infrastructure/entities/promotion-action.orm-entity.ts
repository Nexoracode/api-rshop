import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ActionType } from '../../domain/enums/action-type.enum';
import { PromotionOrmEntity } from './promotion.orm-entity';

@Entity('promotion_actions')
export class PromotionActionOrmEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => PromotionOrmEntity, (promotion) => promotion.actions, {
        onDelete: 'CASCADE',
    })
    promotion: PromotionOrmEntity;

    @Column({ name: 'type', type: 'enum', enum: ActionType })
    type: ActionType;

    @Column({ name: 'value', type: 'decimal', precision: 15, scale: 2, nullable: true })
    value: number | null;

    @Column({ name: 'meta', type: 'json', nullable: true })
    meta: Record<string, any> | null;
}