export function getRefId(v: any): string | undefined {
    if (!v) return undefined;
    // بعضی نسخه‌ها RefID و بعضی refId برمی‌گردونن
    return v.ref_id ?? v.refId ?? v.RefID ?? v.RefId ?? undefined;
}
