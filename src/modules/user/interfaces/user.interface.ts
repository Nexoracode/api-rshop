import { Role } from "src/common/enums/role.enum";
import { Address } from "src/modules/address/entities/address.entity";
import { Card } from "src/modules/card/entities/card.entity";
import { Media } from "src/modules/media/entities/image.entity";
import { Order } from "src/modules/order/entities/order.entity";

export interface IUser {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    isPhoneVerified: boolean;
    email: string;
    password: string;
    role: Role,
    apiToken?: string | null;
    isActive: boolean;
    lastLoginAt: Date;
    avatarUrl?: String;
    addresses: Address[],
    media: Media,
    mediaId: number;
    cards: Card[],
    orders: Order[],
    createdAt: Date;
    updatedAt: Date;
}