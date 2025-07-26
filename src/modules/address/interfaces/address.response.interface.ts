import { User } from "src/modules/user/entities/user.entity";

export interface IAddressResponse {
    id: number;
    city: string;
    province: string;
    addressLine: string;
    isPrimary: boolean;
    postalCode: string;
}
