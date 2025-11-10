// utils/parse-attribute-filter.util.ts
export function parseAttributeFilter(filter: string): Record<number, number[]> {
    if (!filter) return {};

    // مثلاً "1:5,6|2:9"
    const parts = filter.split('|'); // ['1:5,6', '2:9']
    const map: Record<number, number[]> = {};

    for (const part of parts) {
        const [attr, values] = part.split(':');
        const attrId = parseInt(attr, 10);
        if (!attrId || !values) continue;

        const valIds = values.split(',').map(v => parseInt(v, 10)).filter(Boolean);
        if (valIds.length) map[attrId] = valIds;
    }

    return map;
}
