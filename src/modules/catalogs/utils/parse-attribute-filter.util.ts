// src/modules/catalog/utils/parse-attribute-filter.util.ts
export function parseAttributeFilter(raw?: string): Record<number, number[]> {
    if (!raw) return {};

    const result: Record<number, number[]> = {};
    const parts = raw.split('|'); // هر attribute با | جدا شده

    for (const part of parts) {
        const [attr, values] = part.split(':');
        if (!attr || !values) continue;

        const attrId = parseInt(attr.trim());
        const valueIds = values
            .split(',')
            .map((v) => parseInt(v.trim()))
            .filter((v) => !isNaN(v));

        if (!isNaN(attrId) && valueIds.length > 0) {
            result[attrId] = valueIds;
        }
    }

    return result;
}
