import { CreateAttributeGroupDto } from "../dto/create-attribute-group.dto";
import { UpdateAttributeGroupDto } from "../dto/update-attribute-group.dto";
import { IAttributeGroupResponse } from "./attribute-group.response.interface";

export interface IAttributeGroupService {
    create(data: CreateAttributeGroupDto): Promise<IAttributeGroupResponse>;
    update(id: number, data: UpdateAttributeGroupDto): Promise<IAttributeGroupResponse>;
    findOne(id: number): Promise<IAttributeGroupResponse>;
    findAll(): Promise<IAttributeGroupResponse[]>;
    remove(id: number): Promise<Object>;
}