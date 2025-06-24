import { Attribute } from "../../attribute/entities/attribute.entity";
import { AttributeValue } from "../entities/attribute-value.entity";
import { IAttributeValue } from "../interfaces/attribute-value.interface";
import { IAttributeValueResponse } from "../interfaces/attribute-value.response.interface";

export class AttributeValueMapper {

    static toResponse(attrValue: AttributeValue): IAttributeValueResponse {
        return {
            id: attrValue.id,
            value: attrValue.value,
            attribute: attrValue.attribute,
            attributeId: attrValue.attributeId,
            displayColor: attrValue.displayColor,
            displayOrder: attrValue.displayOrder,
            isActive: attrValue.isActive
        }
    }
}