import { Body, Controller, Post } from '@nestjs/common';
import { CheckPromotionUseCase } from '../../application/usecases/check-promotion.usecase';
import { CheckPromotionDto } from '../../application/dtos/check-promotion.dto';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiBadRequestResponse
} from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('18 - 🎁 Promotions (Public)')
@Controller('promotions')
export class PromotionController {
    constructor(private readonly checkPromotionUseCase: CheckPromotionUseCase) { }

    /**
     * بررسی و محاسبه تخفیف برای سفارش
     * این endpoint برای کاربران است تا تخفیف‌های قابل اعمال را ببینند
     */
    @Post('check')
    @Public()
    @ApiOperation({
        summary: 'بررسی و محاسبه تخفیف‌های قابل اعمال',
        description: `
این API تمام تخفیف‌های معتبر برای یک سفارش را بررسی و محاسبه می‌کند.

**کاربردها:**
- محاسبه تخفیف با کد تخفیف (coupon)
- نمایش تخفیف‌های خودکار (flash deals, first order)
- بررسی شرایط ارسال رایگان

**نحوه استفاده:**
1. اگر کد تخفیف دارید، فیلد \`code\` را پر کنید
2. اگر می‌خواهید تمام تخفیف‌های اتوماتیک را ببینید، \`code\` را خالی بگذارید
        `
    })
    @ApiBody({
        type: CheckPromotionDto,
        examples: {
            withCode: {
                summary: 'با کد تخفیف',
                value: {
                    userId: 3,
                    code: 'WINTER2025',
                    subtotal: 8535000,
                    items: [
                        {
                            productId: 21,
                            variantId: 1,
                            categoryId: 522,
                            quantity: 1,
                            unitPrice: 5000000
                        },
                    ]
                }
            },
            withoutCode: {
                summary: 'بدون کد (تخفیف‌های اتوماتیک)',
                value: {
                    userId: 3,
                    subtotal: 8535000,
                    items: [
                        {
                            productId: 21,
                            variantId: 1,
                            categoryId: 522,
                            quantity: 1,
                            unitPrice: 5000000
                        },
                        {
                            productId: 21,
                            variantId: 2,
                            categoryId: 522,
                            quantity: 1,
                            unitPrice: 5000000
                        },
                    ]
                }
            }
        }
    })
    @ApiOkResponse({
        description: 'تخفیف‌ها با موفقیت محاسبه شد',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                status_code: { type: 'number', example: 200 },
                message: { type: 'string', example: 'عملیات با موفقیت انجام شد' },
                data: {
                    type: 'object',
                    properties: {
                        discount: {
                            type: 'number',
                            example: 75000,
                            description: 'مجموع تخفیف به ریال'
                        },
                        free_shipping: {
                            type: 'boolean',
                            example: true,
                            description: 'آیا ارسال رایگان است'
                        },
                        applied_promotions: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    promotion: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'number', example: 1 },
                                            name: { type: 'string', example: 'تخفیف زمستانه' },
                                            type: { type: 'string', example: 'coupon' },
                                            code: { type: 'string', example: 'WINTER2025' }
                                        }
                                    },
                                    discount_amount: {
                                        type: 'number',
                                        example: 75000,
                                        description: 'مقدار تخفیف این پروموشن'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    @ApiNotFoundResponse({
        description: 'کد تخفیف یافت نشد یا منقضی شده',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                status_code: { type: 'number', example: 404 },
                message: { type: 'string', example: 'این کد تخفیف وجود ندارد یا غیر فعال است.' }
            }
        }
    })
    @ApiBadRequestResponse({
        description: 'داده‌های ورودی نامعتبر',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: false },
                status_code: { type: 'number', example: 400 },
                message: { type: 'string', example: 'Validation failed' }
            }
        }
    })
    async check(@Body() dto: CheckPromotionDto) {
        const payload = { ...dto, isFirstOrder: dto.isFirstOrder ?? false };
        const result = await this.checkPromotionUseCase.execute(payload);

        return {
            message: 'تخفیف‌ها با موفقیت محاسبه شد',
            data: result
        };
    }
}
