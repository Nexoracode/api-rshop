// mappers/product-attribute-value.mapper.ts
import { ProductAttributeValue } from "../entities/product-attribute-value.entity";
import { IProductAttributeValueResponse } from "../interfaces/product-attribute-value.response";

export class ProductAttributeValueMapper {
    static toGroupedByAttribute(entities: ProductAttributeValue[]) {
        const grouped: Record<number, {
            attribute: any,
            values: any[],
        }> = {};

        for (const e of entities) {
            if (!grouped[e.attribute.id]) {
                grouped[e.attribute.id] = {
                    attribute: {
                        id: e.attribute.id,
                        name: e.attribute.name,
                        slug: e.attribute.slug,
                        type: e.attribute.type,
                        isVariant: e.attribute.isVariant,
                    },
                    values: [],
                };
            }

            if (e.value) {
                grouped[e.attribute.id].values.push({
                    id: e.value.id,
                    value: e.value.value,
                    displayColor: e.value.displayColor ?? null,
                });
            }
        }

        return Object.values(grouped);
    }

    static toResponse(entity: ProductAttributeValue): IProductAttributeValueResponse {
        return {
            id: entity.id,
            attribute: {
                id: entity.attribute.id,
                name: entity.attribute.name,
                slug: entity.attribute.slug || "",
                type: entity.attribute.type,
                isPublic: entity.attribute.isPublic,
                isVariant: entity.attribute.isVariant,
            },
            value: entity.value
                ? {
                    id: entity.value.id,
                    value: entity.value.value,
                    displayColor: entity.value.displayColor ?? null,
                }
                : null,
        };
    }

    static toResponses(entities: ProductAttributeValue[]): IProductAttributeValueResponse[] {
        return entities.map((e) => this.toResponse(e));
    }
}
