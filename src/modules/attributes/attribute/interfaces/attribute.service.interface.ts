import { IAttributeGroupResponse } from "../../attribute-group/interfaces/attribute-group.response.interface";
import { CreateAttributeDto } from "../dto/create-attribute.dto";
import { UpdateAttributeDto } from "../dto/update-attribute.dto";
import { Attribute } from "../entities/attribute.entity";
import { IAttributeResponse, IAttributeResponseGrouped } from "./attribute.response.interface";

export interface IAttributeService {
    findAll(grouped: boolean): Promise<IAttributeResponse[] | IAttributeResponseGrouped[]>;
    findByGroup(groupId: number): Promise<IAttributeResponseGrouped[]>
    create(data: CreateAttributeDto): Promise<IAttributeResponse>;
    update(id: number, data: UpdateAttributeDto): Promise<IAttributeResponse>;
    remove(id: number): Promise<Object>;
}