import { OrderStatus } from "../enums/order-status.enum";
import { Order } from "../entities/order.entity";


export interface IOrderProduct {
    id: number;
    name: string;
    price: number;
}

export interface IOrderItems {
    id: number;
    order: Order,
    product: IOrderProduct
}

export interface IOrderAddressUser {
    province: string;
    city: string;
}

export interface iUserOrder {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    addresses: IOrderAddressUser[] | null;
}

export interface iAllOrderResponse {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    user: iUserOrder;
    total: number;
    status: OrderStatus;
    items: IOrderItems[] | null
}