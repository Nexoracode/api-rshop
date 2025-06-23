import { Attribute } from "../../attribute/entities/attribute.entity";
import { AttributeValue } from "../entities/attribute-value.entity";
import { IAttributeValue } from "../interfaces/attribute-value.interface";

export class AttributeValueMapper {

    static toResponse(attrValue: AttributeValue): IAttributeValue {
        return {
            id: attrValue.id,
            value: attrValue.value,
            attribute: attrValue.attribute,
            attributeId: attrValue.attributeId,
            displayColor: attrValue.displayColor,
            isActive: attrValue.isActive
        }
    }
}