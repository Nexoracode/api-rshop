import { ProductAttributeValue } from "src/modules/product-attribute-value/entities/product-attribute-value.entity";

type SpecValueOut = {
    id: number | null;
    value: string;
    displayColor: string | null;
    isActive: boolean;
    displayOrder: number | null;
};

type SpecAttributeOut = {
    id: number;
    name: string;
    slug: string;
    type: string;
    isPublic: boolean;
    isVariant: boolean;
    displayOrder: number | null;
    isImportant: boolean | null;
    values: SpecValueOut[];
};

type SpecGroupOut = {
    id: number | null;         // اگه گروه نداشته باشه
    name: string;               // نام گروه
    slug: string | null;
    displayOrder: number | null;
    attributes: SpecAttributeOut[];
};

export function mapSpecificationsGrouped(specs: ProductAttributeValue[]): SpecGroupOut[] {
    // groupId -> group bucket
    const groupMap = new Map<number | 'ungrouped', {
        id: number | null;
        title: string;
        slug: string | null;
        displayOrder: number | null;
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
                displayOrder: (group as any)?.displayOrder ?? null,
                attrMap: new Map<number, SpecAttributeOut>(),
            });
        }

        const g = groupMap.get(gKey)!;

        // attribute bucket
        const attrId = spec.attribute.id;
        if (!g.attrMap.has(attrId)) {
            g.attrMap.set(attrId, {
                isImportant: null,
                id: attrId,
                name: spec.attribute.name,
                slug: (spec.attribute as any).slug ?? "",
                type: spec.attribute.type,
                isPublic: (spec.attribute as any).isPublic ?? true,
                isVariant: spec.attribute.isVariant ?? false,
                displayOrder: (spec.attribute as any).displayOrder ?? null,
                values: [],
            });
        }

        const a = g.attrMap.get(attrId)!;

        // مقدارها: هم value از جدول و هم customValue
        if (spec.value) {
            a.isImportant = (spec as any).isImportant ?? false;
            a.values.push({
                id: spec.value.id,
                value: spec.value.value,
                displayColor: spec.value.displayColor ?? null,
                isActive: (spec.value as any).isActive ?? true,
                displayOrder: (spec.value as any).displayOrder ?? null,
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
                const dx = x.displayOrder ?? Number.MAX_SAFE_INTEGER;
                const dy = y.displayOrder ?? Number.MAX_SAFE_INTEGER;
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
                const da = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
                const db = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
                if (da !== db) return da - db;
                return a.name.localeCompare(b.name, 'fa');
            });

        groups.push({
            id: g.id,
            name: g.title,
            slug: g.slug,
            displayOrder: g.displayOrder,
            attributes,
        });
    }

    // مرتب‌سازی گروه‌ها
    groups.sort((a, b) => {
        const da = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
        const db = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
        if (da !== db) return da - db;
        return a.name.localeCompare(b.name, 'fa');
    });

    return groups;
}
