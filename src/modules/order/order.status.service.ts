import { Injectable } from '@nestjs/common';
import { EntityManager } from "typeorm";
import { OrderStatus } from "./enums/order-status.enum";
import { Order } from "./entities/order.entity";
import { OrderCacheService } from "./cache/order-cache.service";
import { User } from "../user/entities/user.entity";

@Injectable()
export class OrderStatusService {
    constructor(
        private readonly orderCacheService: OrderCacheService
    ) { }
    async updateOrderStatus(order: Order, status: OrderStatus, manager: EntityManager) {
        const orderRepo = manager.getRepository(Order);
        order.status = status; // or any other status based on your logic
        const user: User = order.user
        console.log('Clearing order cache for user:', user.id);
        await this.orderCacheService.clearUserOrderCache(user.id);
        await orderRepo.save(order);
    }
}