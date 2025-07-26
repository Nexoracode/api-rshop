import { Address } from "../entities/address.entity";
import { IAddressResponse } from "../interfaces/address.response.interface";

export class AddressMapper {
    static toResponse(address: Address): IAddressResponse {
        return {
            id: address.id,
            city: address.city,
            province: address.province,
            addressLine: address.addressLine,
            postalCode: address.postalCode,
            isPrimary: address.isPrimary,
        }
    }
}