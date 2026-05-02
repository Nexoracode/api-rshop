import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';

export class PromotionNotFoundException extends NotFoundException {
    constructor(identifier: string | number) {
        super({
            message: `کد تخفیف '${identifier}' وجود ندارد یا غیرفعال است.`,
            reasonCode: 'PROMOTION_NOT_FOUND',
        });
    }
}

export class PromotionExpiredException extends BadRequestException {
    constructor(code: string) {
        super({
            message: `مدت اعتبار کد تخفیف '${code}' به پایان رسیده است.`,
            reasonCode: 'PROMOTION_EXPIRED',
        });
    }
}

export class PromotionLimitReachedException extends BadRequestException {
    constructor(code: string) {
        super({
            message: `ظرفیت استفاده از کد تخفیف '${code}' تکمیل شده است.`,
            reasonCode: 'USAGE_LIMIT_REACHED',
        });
    }
}

export class PromotionInactiveException extends BadRequestException {
    constructor(code: string) {
        super({
            message: `کد تخفیف '${code}' غیرفعال است.`,
            reasonCode: 'PROMOTION_INACTIVE',
        });
    }
}

export class PromotionNotStartedException extends BadRequestException {
    constructor(code: string, startsAt: Date) {
        super({
            message: `کد تخفیف '${code}' هنوز فعال نشده است.`,
            reasonCode: 'PROMOTION_NOT_STARTED',
            meta: { startsAt },
        });
    }
}

export class PromotionConditionsNotMetException extends UnprocessableEntityException {
    constructor(code: string, reason: string, reasonCode: string, meta?: Record<string, any>) {
        super({
            message: reason,
            reasonCode,
            meta: meta ?? null,
        });
    }
}
