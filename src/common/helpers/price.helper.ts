/**
 * Helper: Price Calculation
 * محاسبه‌ی قیمت نهایی با در نظر گرفتن discountAmount و discountPercent
 */
export interface DiscountOptions {
    price: number | string;
    discountAmount?: number | string | null;
    discountPercent?: number | string | null;
}

/**
 * برمی‌گرداند قیمت نهایی بعد از اعمال تخفیف
 * @param {DiscountOptions} options
 * @returns {number} finalPrice
 */
export function getFinalPrice(options: DiscountOptions): number {
    const price = Number(options.price || 0);
    const discountAmount = Number(options.discountAmount || 0);
    const discountPercent = Number(options.discountPercent || 0);

    if (isNaN(price)) return 0;

    let final = price;

    if (discountAmount > 0) {
        final -= discountAmount;
    } else if (discountPercent > 0) {
        final -= (price * discountPercent) / 100;
    }

    return Math.max(final, 0); // از منفی شدن جلوگیری می‌کنیم
}

/**
 * برمی‌گرداند اطلاعات کامل قیمت با تخفیف
 * برای مواقعی که در خروجی JSON می‌خوای تمام مقادیر رو داشته باشی
 */
export function buildPriceObject(options: DiscountOptions) {
    const price = Number(options.price || 0);
    const discountAmount = Number(options.discountAmount || 0);
    const discountPercent = Number(options.discountPercent || 0);
    const finalPrice = getFinalPrice({ price, discountAmount, discountPercent });

    return {
        price,
        discountAmount,
        discountPercent,
        finalPrice: Math.round(finalPrice),
    };
}
