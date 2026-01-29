import { VariantProduct } from "src/modules/variant-product/entities/variant-product.entity";
import { Product } from "../entities/product.entity";
import { mapSpecificationsGrouped } from "./spec.mapper";
import { getAverageRating } from "src/common/helpers/review.helper";

export class ProductMapper {
    static uniqVariantAttributes(variant: any) {
        const map = new Map<string, any>();
        for (const va of variant.attributes || []) {
            const key = `${va.attributeId}:${va.valueId}`;
            if (!map.has(key)) map.set(key, va);
        }
        return [...map.values()];
    }

    private static cartesian<T>(arr: T[][]): T[][] {
        if (!arr.length) return [];
        return arr.reduce(
            (a, b) => a.flatMap((x) => b.map((y) => [...x, y])),
            [[]] as T[][]
        );
    }

    private static variantKeyFromAttrs(attrs: Array<{ attributeId: number; valueId: number }>): string {
        const pairs = attrs.map((a) => `${a.attributeId}:${a.valueId}`);
        return pairs.sort().join("|");
    }

    static buildVariantName(attrs: any[]): string {
        const values = attrs
            .map((a) => (a.values ? a.values.value : null))
            .filter(Boolean);
        return [...values].join(" - ");
    }

    private static mapAttributeNodes(product: any) {
        const groupMap = new Map<number | string, any>();

        for (const v of product.variants || []) {
            for (const va of v.attributes || []) {
                const attr = va.attribute;
                if (!attr) continue;

                const groupId = attr.group?.id ?? `ungrouped-${attr.id}`;
                if (!groupMap.has(groupId)) {
                    groupMap.set(groupId, {
                        id: attr.group?.id ?? null,
                        name: attr.group?.name ?? "بدون گروه",
                        slug: attr.group?.slug ?? null,
                        display_order: attr.group?.displayOrder ?? null,
                        attributes: new Map<number, any>(),
                    });
                }

                const groupNode = groupMap.get(groupId);
                if (!groupNode.attributes.has(attr.id)) {
                    groupNode.attributes.set(attr.id, {
                        id: attr.id,
                        name: attr.name,
                        slug: attr.slug ?? null,
                        is_public: attr.isPublic ?? true,
                        group_id: attr.group?.id ?? null,
                        type: attr.type,
                        display_order: attr.displayOrder ?? null,
                        is_variant: attr.isVariant ?? false,
                        values: [] as any[],
                    });
                }

                const attrNode = groupNode.attributes.get(attr.id);

                if (Array.isArray(attr.values)) {
                    for (const val of attr.values) {
                        if (!attrNode.values.some((x: any) => x.id === val.id)) {
                            attrNode.values.push({
                                id: val.id,
                                value: val.value,
                                attribute_id: val.attributeId,
                                display_color: val.displayColor ?? "",
                                display_order: val.displayOrder ?? null,
                                is_active: val.isActive ?? true,
                            });
                        }
                    }
                }

                if (va.value && !attrNode.values.some((x: any) => x.id === va.value.id)) {
                    attrNode.values.push({
                        id: va.value.id,
                        value: va.value.value,
                        attribute_id: va.value.attributeId,
                        display_color: va.value.displayColor ?? "",
                        display_order: va.value.displayOrder ?? null,
                        is_active: va.value.isActive ?? true,
                    });
                }
            }
        }

        return [...groupMap.values()].map((g) => ({
            id: g.id,
            name: g.name,
            slug: g.slug,
            display_order: g.display_order,
            attributes: [...g.attributes.values()],
        }));
    }

    static mapVariantsFromDb(product: any) {
        return (product.variants || []).map((v: any) => {
            const attrs = (ProductMapper.uniqVariantAttributes(v) || []).map((va: any) => {
                const attr = va.attribute;
                return {
                    id: attr?.id,
                    name: attr?.name,
                    slug: attr?.slug ?? null,
                    is_public: attr?.isPublic ?? true,
                    group_id: attr?.group ? attr.group.id : null,
                    type: attr?.type,
                    display_order: attr?.displayOrder ?? null,
                    is_variant: attr?.isVariant ?? false,
                    values: va.value
                        ? {
                            id: va.value.id,
                            value: va.value.va.value,
                            attribute_id: va.value.attribute_id,
                            display_color: va.value.display_color ?? "",
                            is_active: va.value.is_active ?? true,
                            display_order: va.value.display_order ?? null,
                        }
                        : null,
                };
            });

            return {
                id: v.id,
                product_id: v.productId,
                sku: v.sku || "",
                price: v.price,
                discount_amount: v.discountAmount ?? 0,
                discount_percent: v.discountPercent ?? 0,
                stock: v.stock,
                attributes: attrs,
                name: ProductMapper.buildVariantName(attrs),
            };
        });
    }

    private static mapVariantsFromAttributeNodes(product: any, attributeNodes: any[]) {
        const dbIndex = new Map<string, VariantProduct>();

        for (const v of product.variants || []) {
            const uniq = ProductMapper.uniqVariantAttributes(v);
            const key = ProductMapper.variantKeyFromAttrs(
                uniq.map((va) => ({
                    attributeId: va.attribute.id,  // 👈 از relation
                    valueId: va.value.id,          // 👈 از relation
                }))
            );
            dbIndex.set(key, v);
        }

        const perAttribute: any[][] = [];
        for (const group of attributeNodes || []) {
            for (const attr of group.attributes || []) {
                const list = (attr.values || []).map((val: any) => ({
                    attribute: {
                        id: attr.id,
                        name: attr.name,
                        slug: attr.slug,
                        is_public: attr.isPublic,
                        group_id: attr.groupId,
                        type: attr.type,
                        display_order: attr.displayOrder,
                        is_variant: attr.isVariant,
                    },
                    value: {
                        id: val.id,
                        value: val.value,
                        attribute_id: val.attribute_id,
                        display_color: val.display_color ?? "",
                        is_active: val.is_active ?? true,
                        display_order: val.display_order ?? null,
                    },
                }));
                if (list.length) perAttribute.push(list);
            }
        }

        if (!perAttribute.length) return [];

        const combos = ProductMapper.cartesian(perAttribute);

        return combos.map((combo: any[], idx: number) => {
            const attrs = combo.map((c) => ({
                ...c.attribute,
                values: c.value,
            }));

            const key = ProductMapper.variantKeyFromAttrs(
                combo.map((c) => ({
                    attributeId: c.attribute.id,
                    valueId: c.value.id,
                }))
            );


            const matched = dbIndex.get(key);

            return {
                name: ProductMapper.buildVariantName(attrs),
                id: matched?.id ?? null,
                product_id: product.id,
                sku: matched?.sku ?? `AUTO-${product.id}-${idx + 1}`,
                price: matched?.price ?? product.price,
                discountAmount: matched?.discountAmount ?? 0,
                discountPercent: matched?.discountPercent ?? 0,
                stock: matched?.stock ?? 0,
                attributes: attrs,
            };
        });
    }

    static toResponse(product: Product, opts: { cartesian?: boolean } = {}): any {
        const attribute_nodes = ProductMapper.mapAttributeNodes(product);

        const variants = opts.cartesian
            ? ProductMapper.mapVariantsFromAttributeNodes(product, attribute_nodes)
            : ProductMapper.mapVariantsFromDb(product);

        return {
            id: product.id,
            name: product.name,
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            sku: product.sku || "",
            isLimitedStock: product.isLimitedStock || false,
            isSameDayShipping: product.isSameDayShipping,
            orderLimit: product.orderLimit || null,
            requiresPreparation: product.requiresPreparation || false,
            preparationDays: product.preparationDays || null,
            mediaPinned: product.mediaPinned || null,
            mediaPinnedId: product.mediaPinnedId || null,
            category: product.category || null,
            categoryId: product.categoryId || null,
            brand: product.brand || null,
            brandId: product.brandId || null,
            discountAmount: product.discountAmount || 0,
            discountPercent: product.discountPercent || 0,
            isFeatured: product.isFeatured || false,
            weight: product.weight || null,
            weightUnit: product.weightUnit || null,
            helper: product.helper || null,
            helperId: product.helperId || null,
            isVisible: product.isVisible || false,
            averageRaiting: getAverageRating((product as any).reviews || []),
            reviewsCount: (product as any).reviewsCount || 0,
            medias: product.medias ? product.medias.map((m) => ({
                id: m.id,
                url: m.url,
                alt: m.altText,
                type: m.type,
            })) : [],
            mediaIds: product.medias.length ? product.medias.map((p) => p.id) : [],
            variants,
            specifications: mapSpecificationsGrouped(product.attributeValues || []),
            attribute_nodes,
            created_at: product.createdAt,
            updated_at: product.updatedAt,
        };
    }
}