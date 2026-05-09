import { CustomRequest } from "src/common/interfaces/request.interface";
import { CreateAddressDto } from "../dto/create-address.dto";
import { UpdateAddressDto } from "../dto/update-address.dto";
import { IAddressResponse } from "./address.response.interface";
import { Request } from "express";
export interface IAddressService {
    create(userId: number, data: CreateAddressDto): Promise<IAddressResponse>;
    update(id: number, data: UpdateAddressDto): Promise<IAddressResponse>;
    remove(userId: number, id: number): Promise<Object>;
    findByUserId(userId: number): Promise<IAddressResponse[]>;
    findMe(userId: number): Promise<IAddressResponse>;
}