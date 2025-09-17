import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Card, CardStatus } from '../card/entities/card.entity';
import { CardItem } from '../card/entities/card-item.entity';
import { User } from '../user/entities/user.entity';
import { CreateOrderFromCardDto } from './dto/create-from-card.dto';
import { runInTransaction } from 'src/common/helpers/transaction.helper';

@Injectable()
export class OrderService {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource
    ) { }

    async createFromCard(user: User, _dto: CreateOrderFromCardDto) {
        return runInTransaction(this.dataSource, async (m) => {
            const cardRepo = m.getRepository(Card);
            const itemRepo = m.getRepository(CardItem);
            const orderRepo = m.getRepository(Order);
            const orderItemRepo = m.getRepository(OrderItem);

            const card = await cardRepo.findOne({ where: { user: { id: user.id } }, relations: ['items'], lock: { mode: 'pessimistic_write' } });
            if (!card || !card.items?.length) throw new BadRequestException('سبد خرید خالی است.');
            if (card.status === CardStatus.ABANDONED) throw new BadRequestException('سبد خرید بسته شده است.');

            card.status = CardStatus.LOCKED;
            await cardRepo.save(card);

            const order = await orderRepo.save(orderRepo.create({
                user,
                status: OrderStatus.PENDING,
                subtotal: card.subtotal,
                discountTotal: card.discountTotal,
                total: card.total,
            }));

            for (const ci of card.items) {
                await orderItemRepo.save(orderItemRepo.create({
                    order,
                    product: ci.product,
                    variant: ci.variant || null,
                    quantity: ci.quantity,
                    unitPrice: ci.unitPrice,
                    discount: ci.discount,
                    lineTotal: ci.lineTotal,
                }));
            }

            await itemRepo.delete({ card: { id: card.id } as any });
            card.itemsCount = 0; card.totalQuantity = 0; card.subtotal = 0; card.discountTotal = 0; card.total = 0;
            await cardRepo.save(card);


            return order;
        });
    }
    async getMyOrders(user: User) {
        return await this.dataSource.getRepository(Order).find({ where: { user: { id: user.id } }, order: { createdAt: 'DESC' } as any });
    }


    async getOne(user: User, id: string) {
        const order = await this.dataSource.getRepository(Order).findOne({ where: { id, user: { id: user.id } }, relations: ['items'] });
        if (!order) throw new NotFoundException('سفارش یافت نشد.');
        return order;
    }
}