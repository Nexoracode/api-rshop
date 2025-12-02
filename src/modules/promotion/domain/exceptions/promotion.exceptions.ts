import { BadRequestException, NotFoundException } from '@nestjs/common';

/**
 * پروموشن پیدا نشد
 */
export class PromotionNotFoundException extends NotFoundException {
    constructor(identifier: string | number) {
        super({
            message: `پروموشن با شناسه '${identifier}' یافت نشد`,
            error: 'PROMOTION_NOT_FOUND',
            statusCode: 404,
        });
    }
}

/**
 * کد تخفیف منقضی شده است
 */
export class PromotionExpiredException extends BadRequestException {
    constructor(code: string) {
        super({
            message: `کد تخفیف '${code}' منقضی شده است`,
            error: 'PROMOTION_EXPIRED',
            statusCode: 400,
        });
    }
}

/**
 * محدودیت استفاده از کد تخفیف به پایان رسیده
 */
export class PromotionLimitReachedException extends BadRequestException {
    constructor(code: string) {
        super({
            message: `کد تخفیف '${code}' به حد مجاز استفاده رسیده است`,
            error: 'PROMOTION_LIMIT_REACHED',
            statusCode: 400,
        });
    }
}

/**
 * کد تخفیف غیرفعال است
 */
export class PromotionInactiveException extends BadRequestException {
    constructor(code: string) {
        super({
            message: `کد تخفیف '${code}' غیرفعال است`,
            error: 'PROMOTION_INACTIVE',
            statusCode: 400,
        });
    }
}

/**
 * کد تخفیف هنوز شروع نشده است
 */
export class PromotionNotStartedException extends BadRequestException {
    constructor(code: string, startsAt: Date) {
        super({
            message: `کد تخفیف '${code}' از تاریخ ${startsAt.toISOString()} فعال می‌شود`,
            error: 'PROMOTION_NOT_STARTED',
            statusCode: 400,
        });
    }
}

/**
 * شرایط استفاده از پروموشن برآورده نشده
 */
export class PromotionConditionsNotMetException extends BadRequestException {
    constructor(code: string, reason?: string) {
        const message = reason
            ? `شرایط استفاده از کد تخفیف '${code}' برآورده نشده: ${reason}`
            : `شرایط استفاده از کد تخفیف '${code}' برآورده نشده است`;

        super({
            message,
            error: 'PROMOTION_CONDITIONS_NOT_MET',
            statusCode: 400,
        });
    }
}
