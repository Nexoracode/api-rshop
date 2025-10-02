export type ParsedAttributeFilter = Record<number, number[]>;

/**
 * ورودی شبیه "47:55,56|48:60"
 * خروجی: { 47: [55,56], 48: [60] }
 */
export function parseAttributeFilter(str?: string): ParsedAttributeFilter {
    const out: ParsedAttributeFilter = {};
    if (!str) return out;

    for (const group of str.split('|')) {
        const [aid, vals] = group.split(':');
        if (!aid || !vals) continue;
        out[+aid] = vals.split(',').map((v) => +v).filter(Boolean);
    }
    return out;
}
