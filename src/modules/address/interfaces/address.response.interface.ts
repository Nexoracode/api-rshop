import { User } from "src/modules/user/entities/user.entity";

export interface IAddressResponse {
    id: number;
    city: string;
    province: string;
    addressLine: string;
    isPrimary: boolean;
    postalCode: string;
    addressName: string;
    recipientName: string;
    recipientPhone: string;
    plaque?: string;
    unit?: string;
    isSelf: boolean;
}
