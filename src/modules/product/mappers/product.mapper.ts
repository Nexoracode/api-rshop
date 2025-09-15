export class ProductMapper {
    private static uniqVariantAttributes(variant: any) {
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

    private static buildVariantName(productName: string, attrs: any[]): string {
        const values = attrs
            .map((a) => (a.values ? a.values.value : null))
            .filter((v) => !!v);
        return [productName, ...values].join(" , ");
    }

    // attribute_nodes از روی variants
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

                // همه‌ی مقادیر attribute
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

                // مقدار انتخاب‌شده هم حتماً اضافه شود
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

    private static mapVariantsFromDb(product: any) {
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
                            value: va.value.value,
                            attribute_id: va.value.attributeId,
                            display_color: va.value.displayColor ?? "",
                            is_active: va.value.isActive ?? true,
                            display_order: va.value.displayOrder ?? null,
                        }
                        : null,
                };
            });

            return {
                name: ProductMapper.buildVariantName(product.name, attrs), // 👈 اضافه شد
                product_id: v.productId,
                sku: v.sku || "",
                price: v.price,
                discount_amount: v.discountAmount ?? 0,
                discount_percent: v.discountPercent ?? 0,
                stock: v.stock,
                attributes: attrs,
            };
        });
    }

    private static mapVariantsFromAttributeNodes(product: any, attributeNodes: any[]) {
        const perAttribute: any[][] = [];

        for (const group of attributeNodes || []) {
            for (const attr of group.attributes || []) {
                const list = (attr.values || []).map((val: any) => ({
                    attribute: {
                        id: attr.id,
                        name: attr.name,
                        slug: attr.slug,
                        is_public: attr.is_public,
                        group_id: attr.group_id,
                        type: attr.type,
                        display_order: attr.display_order,
                        is_variant: attr.is_variant,
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
                if (list.length > 0) perAttribute.push(list);
            }
        }

        if (perAttribute.length === 0) return [];

        const combos = ProductMapper.cartesian(perAttribute);

        return combos.map((combo, idx) => {
            const attrs = combo.map((c: any) => ({
                ...c.attribute,
                values: c.value,
            }));

            return {
                name: ProductMapper.buildVariantName(product.name, attrs), // 👈 اضافه شد
                product_id: product.id,
                sku: `AUTO-${product.id}-${idx + 1}`,
                price: product.price,
                discount_amount: product.discountAmount ?? 0,
                discount_percent: product.discountPercent ?? 0,
                stock: product.stock ?? 0,
                attributes: attrs,
            };
        });
    }

    static toResponse(product: any, opts: { cartesian?: boolean } = {}): any {
        const attribute_nodes = ProductMapper.mapAttributeNodes(product);

        const variants = opts.cartesian
            ? ProductMapper.mapVariantsFromAttributeNodes(product, attribute_nodes)
            : ProductMapper.mapVariantsFromDb(product);

        return {
            ...product,
            variants,
            attribute_nodes,
        };
    }
}
