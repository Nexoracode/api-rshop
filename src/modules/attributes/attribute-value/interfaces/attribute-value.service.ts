import { CreateAttributeValueDto } from "../dto/create-attribute-value.dto";
import { UpdateAttributeValueDto } from "../dto/update-attribute-value.dto";
import { IAttributeValueResponse } from "./attribute-value.response.interface";

export interface IAttributeValueService {
    findByAttribute(attributeId: number): Promise<IAttributeValueResponse[]>;
    create(data: CreateAttributeValueDto): Promise<IAttributeValueResponse>;
    update(id: number, data: UpdateAttributeValueDto): Promise<IAttributeValueResponse>;
    remove(id: number): Promise<Object>;
    updateOrder(id: number, order: number): Promise<Object>;
}