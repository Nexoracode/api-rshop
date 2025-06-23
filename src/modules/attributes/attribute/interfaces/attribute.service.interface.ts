import { CreateAttributeDto } from "../dto/create-attribute.dto";
import { UpdateAttributeDto } from "../dto/update-attribute.dto";
import { Attribute } from "../entities/attribute.entity";
import { IAttributeResponse } from "./attribute.response.interface";

export interface IAttributeService {
    findAll(): Promise<IAttributeResponse[]>;
    create(data: CreateAttributeDto): Promise<IAttributeResponse>;
    update(id: number, data: UpdateAttributeDto): Promise<IAttributeResponse>;
    remove(id: number): Promise<Object>;
}