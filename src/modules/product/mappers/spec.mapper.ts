import { ProductAttributeValue } from "src/modules/product-attribute-value/entities/product-attribute-value.entity";

type SpecValueOut = {
    id: number | null;
    value: string;
    display_color: string | null;
    is_active: boolean;
    display_order: number | null;
};

type SpecAttributeOut = {
    id: number;
    name: string;
    slug: string;
    type: string;
    is_public: boolean;
    is_variant: boolean;
    display_order: number | null;
    values: SpecValueOut[];
};

type SpecGroupOut = {
    id: number | null;           // اگه گروه نداشته باشه
    name: string;               // نام گروه
    slug: string | null;
    display_order: number | null;
    attributes: SpecAttributeOut[];
};

export function mapSpecificationsGrouped(specs: ProductAttributeValue[]): SpecGroupOut[] {
    // groupId -> group bucket
    const groupMap = new Map<number | 'ungrouped', {
        id: number | null;
        title: string;
        slug: string | null;
        display_order: number | null;
        attrMap: Map<number, SpecAttributeOut>;
    }>();

    for (const spec of specs || []) {
        const group = spec.attribute?.group;
        const gKey: number | 'ungrouped' = group?.id ?? 'ungrouped';

        if (!groupMap.has(gKey)) {
            groupMap.set(gKey, {
                id: group?.id ?? null,
                title: group?.name ?? "سایر مشخصات",
                slug: (group as any)?.slug ?? null,
                display_order: (group as any)?.displayOrder ?? null,
                attrMap: new Map<number, SpecAttributeOut>(),
            });
        }

        const g = groupMap.get(gKey)!;

        // attribute bucket
        const attrId = spec.attribute.id;
        if (!g.attrMap.has(attrId)) {
            g.attrMap.set(attrId, {
                id: attrId,
                name: spec.attribute.name,
                slug: (spec.attribute as any).slug ?? "",
                type: spec.attribute.type,
                is_public: (spec.attribute as any).isPublic ?? true,
                is_variant: spec.attribute.isVariant ?? false,
                display_order: (spec.attribute as any).displayOrder ?? null,
                values: [],
            });
        }

        const a = g.attrMap.get(attrId)!;

        // مقدارها: هم value از جدول و هم customValue
        if (spec.value) {
            a.values.push({
                id: spec.value.id,
                value: spec.value.value,
                display_color: spec.value.displayColor ?? null,
                is_active: (spec.value as any).isActive ?? true,
                display_order: (spec.value as any).displayOrder ?? null,
            });
        }
    }

    // ددیوپ کردن values داخل هر attribute (براساس id یا متن custom)
    for (const { attrMap } of groupMap.values()) {
        for (const attr of attrMap.values()) {
            const seen = new Set<string>();
            attr.values = attr.values.filter(v => {
                const key = v.id !== null ? `id:${v.id}` : `custom:${v.value.trim()}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            // مرتب‌سازی اختیاری
            attr.values.sort((x, y) => {
                const dx = x.display_order ?? Number.MAX_SAFE_INTEGER;
                const dy = y.display_order ?? Number.MAX_SAFE_INTEGER;
                if (dx !== dy) return dx - dy;
                return String(x.value).localeCompare(String(y.value), 'fa');
            });
        }
    }

    // خروجی نهایی
    const groups: SpecGroupOut[] = [];
    for (const g of groupMap.values()) {
        const attributes = Array.from(g.attrMap.values())
            .sort((a, b) => {
                const da = a.display_order ?? Number.MAX_SAFE_INTEGER;
                const db = b.display_order ?? Number.MAX_SAFE_INTEGER;
                if (da !== db) return da - db;
                return a.name.localeCompare(b.name, 'fa');
            });

        groups.push({
            id: g.id,
            name: g.title,
            slug: g.slug,
            display_order: g.display_order,
            attributes,
        });
    }

    // مرتب‌سازی گروه‌ها
    groups.sort((a, b) => {
        const da = a.display_order ?? Number.MAX_SAFE_INTEGER;
        const db = b.display_order ?? Number.MAX_SAFE_INTEGER;
        if (da !== db) return da - db;
        return a.name.localeCompare(b.name, 'fa');
    });

    return groups;
}
