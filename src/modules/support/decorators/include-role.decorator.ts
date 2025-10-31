import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export function includeRole<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    aliases: string[] = [],
): SelectQueryBuilder<T> {
    // اضافه‌کردن نقش برای تمام aliasهایی که user هستند
    aliases.forEach((alias) => {
        qb.addSelect(`${alias}.role`);
    });
    return qb;
}
