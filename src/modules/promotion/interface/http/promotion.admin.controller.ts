import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiQuery,
    ApiBody,
    ApiOkResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiParam
} from '@nestjs/swagger';
import { CreatePromotionUseCase } from '../../application/usecases/create-promotion.usecase';
import { UpdatePromotionUseCase } from '../../application/usecases/update-promotion.usecase';
import { DeletePromotionUseCase } from '../../application/usecases/delete-promotion.usecase';
import { ListPromotionsUseCase } from '../../application/usecases/list-promotion.usecase';
import { CreatePromotionDto } from '../../application/dtos/create-promotion.dto';
import { UpdatePromotionDto } from '../../application/dtos/update-promotion.dto';
import { ApiPaginationQuery, FilterOperator, PaginateQuery } from 'nestjs-paginate';
import { GetPromotionByIdUseCase } from '../../application/usecases/get-promotion-by-id.usecase';
import { PromotionDetailResponseDto, PromotionResponseDto } from '../../application/dtos/promotion-response.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('19 - 🎁 Promotions (Admin)')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/promotions')
export class PromotionAdminController {
    constructor(
        private readonly createUseCase: CreatePromotionUseCase,
        private readonly updateUseCase: UpdatePromotionUseCase,
        private readonly deleteUseCase: DeletePromotionUseCase,
        private readonly listUseCase: ListPromotionsUseCase,
        private readonly getByIdUseCase: GetPromotionByIdUseCase,
    ) { }

    /**
     * ایجاد پروموشن جدید
     */
    @Post()
    @ApiOperation({
        summary: 'ایجاد پروموشن جدید',
        description: `
ایجاد یک پروموشن/تخفیف جدید با شرایط و عملیات دلخواه.

**انواع Promotion:**
- \`coupon\`: کد تخفیف (نیاز به code دارد)
- \`flash_deal\`: فروش ویژه
- \`free_shipping\`: ارسال رایگان
- \`first_order\`: تخفیف اولین خرید
- \`next_order_reward\`: کوپن خرید بعدی

**شرایط (Conditions):**
- \`user\`: کاربر خاص
- \`product\`: محصول/واریانت خاص
- \`category\`: دسته‌بندی خاص
- \`min_order_amount\`: حداقل مبلغ سفارش
- \`first_order\`: اولین خرید

**عملیات (Actions):**
- \`percent_discount\`: تخفیف درصدی
- \`amount_discount\`: تخفیف مبلغی
- \`free_shipping\`: ارسال رایگان
- \`next_order_coupon\`: کوپن خرید بعدی
        `
    })
    @ApiBody({
        type: CreatePromotionDto,
        examples: {
            flashDeal: {
                summary: 'فروش ویژه محصول خاص',
                value: {
                    name: 'فروش ویژه آیفون 13',
                    type: 'flash_deal',
                    starts_at: '2025-12-01T00:00:00.000Z',
                    ends_at: '2025-12-03T23:59:59.000Z',
                    usage_limit: 100,
                    is_active: true,
                    conditions: [
                        {
                            type: 'product',
                            products: [
                                {
                                    product_id: 100,
                                    variant_ids: [501, 502]
                                }
                            ]
                        }
                    ],
                    actions: [
                        {
                            type: 'percent_discount',
                            value: 15
                        },
                        {
                            type: 'free_shipping'
                        }
                    ]
                }
            },
            couponCode: {
                summary: 'کد تخفیف با حداقل خرید',
                value: {
                    name: 'تخفیف زمستانه',
                    type: 'coupon',
                    code: 'WINTER2025',
                    starts_at: '2025-12-01T00:00:00.000Z',
                    ends_at: '2025-12-31T23:59:59.000Z',
                    usage_limit: 500,
                    is_active: true,
                    conditions: [
                        {
                            type: 'min_order_amount',
                            min_amount: 500000
                        }
                    ],
                    actions: [
                        {
                            type: 'amount_discount',
                            value: 50000
                        }
                    ]
                }
            },
            firstOrder: {
                summary: 'تخفیف اولین خرید',
                value: {
                    name: 'تخفیف کاربران جدید',
                    type: 'first_order',
                    starts_at: '2025-01-01T00:00:00.000Z',
                    ends_at: '2025-12-31T23:59:59.000Z',
                    is_active: true,
                    conditions: [
                        {
                            type: 'first_order'
                        }
                    ],
                    actions: [
                        {
                            type: 'percent_discount',
                            value: 10
                        }
                    ]
                }
            }
        }
    })
    @ApiCreatedResponse({
        description: 'پروموشن با موفقیت ایجاد شد',
        type: PromotionResponseDto
    })
    @ApiBadRequestResponse({
        description: 'داده‌های ورودی نامعتبر'
    })
    create(@Body() dto: CreatePromotionDto) {
        return this.createUseCase.execute(dto);
    }

    /**
     * دریافت لیست پروموشن‌ها با Pagination
     */
    @Get()
    @ApiOperation({
        summary: 'دریافت لیست پروموشن‌ها',
        description: `
دریافت لیست تمام پروموشن‌ها با قابلیت فیلتر، جستجو و مرتب‌سازی.

**قابلیت‌ها:**
- Pagination
- Search در name و code
- Filter بر اساس type و isActive
- Sort بر اساس id, startsAt, endsAt
        `
    })
    @ApiPaginationQuery({
        sortableColumns: ['id', 'startsAt', 'endsAt'],
        searchableColumns: ['code', 'name'],
        filterableColumns: {
            type: [FilterOperator.EQ, FilterOperator.IN],
            isActive: [FilterOperator.EQ],
            startsAt: [FilterOperator.LTE, FilterOperator.GTE],
            endsAt: [FilterOperator.LTE, FilterOperator.GTE],
        },
        defaultSortBy: [['id', 'DESC']],
        maxLimit: 100,
    })
    @ApiOkResponse({
        description: 'لیست پروموشن‌ها با موفقیت دریافت شد',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                status_code: { type: 'number', example: 200 },
                message: { type: 'string', example: 'عملیات با موفقیت انجام شد' },
                data: {
                    type: 'object',
                    properties: {
                        items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/PromotionDetailResponseDto' }
                        },
                        meta: {
                            type: 'object',
                            properties: {
                                total_items: { type: 'number', example: 50 },
                                item_count: { type: 'number', example: 10 },
                                items_per_page: { type: 'number', example: 10 },
                                total_pages: { type: 'number', example: 5 },
                                current_page: { type: 'number', example: 1 }
                            }
                        }
                    }
                }
            }
        }
    })
    list(@Query() query: PaginateQuery) {
        return this.listUseCase.execute(query);
    }

    /**
     * دریافت جزئیات یک پروموشن
     */
    @Get(':id')
    @ApiOperation({
        summary: 'دریافت جزئیات پروموشن',
        description: 'دریافت اطلاعات کامل یک پروموشن شامل شرایط و عملیات'
    })
    @ApiParam({
        name: 'id',
        type: 'number',
        description: 'شناسه پروموشن',
        example: 1
    })
    @ApiOkResponse({
        description: 'جزئیات پروموشن با موفقیت دریافت شد',
        type: PromotionDetailResponseDto
    })
    @ApiNotFoundResponse({
        description: 'پروموشن یافت نشد'
    })
    getById(@Param('id', ParseIntPipe) id: number) {
        return this.getByIdUseCase.execute(id);
    }

    /**
     * بروزرسانی پروموشن
     */
    @Put(':id')
    @ApiOperation({
        summary: 'بروزرسانی پروموشن',
        description: `
ویرایش یک پروموشن موجود.

**نکات مهم:**
- تمام فیلدها اختیاری هستند
- شرایط و عملیات جدید جایگزین قبلی می‌شوند
- کد تخفیف را می‌توان تغییر داد (باید unique باشد)
        `
    })
    @ApiParam({
        name: 'id',
        type: 'number',
        description: 'شناسه پروموشن',
        example: 1
    })
    @ApiBody({
        type: UpdatePromotionDto,
        examples: {
            updateName: {
                summary: 'تغییر نام و تاریخ',
                value: {
                    name: 'فروش ویژه نوروز',
                    ends_at: '2025-03-31T23:59:59.000Z'
                }
            },
            deactivate: {
                summary: 'غیرفعال کردن',
                value: {
                    is_active: false
                }
            },
            updateConditions: {
                summary: 'تغییر شرایط',
                value: {
                    conditions: [
                        {
                            type: 'min_order_amount',
                            min_amount: 1000000
                        }
                    ]
                }
            }
        }
    })
    @ApiOkResponse({
        description: 'پروموشن با موفقیت بروزرسانی شد',
        type: PromotionResponseDto
    })
    @ApiNotFoundResponse({
        description: 'پروموشن یافت نشد'
    })
    @ApiBadRequestResponse({
        description: 'داده‌های ورودی نامعتبر'
    })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdatePromotionDto
    ) {
        return this.updateUseCase.execute(id, dto);
    }

    /**
     * حذف پروموشن
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'حذف پروموشن',
        description: `
حذف یک پروموشن از سیستم.

**هشدار:** این عملیات غیرقابل بازگشت است!

**نکته:** اگر پروموشن استفاده شده، بهتر است به جای حذف، آن را غیرفعال کنید.
        `
    })
    @ApiParam({
        name: 'id',
        type: 'number',
        description: 'شناسه پروموشن',
        example: 1
    })
    @ApiOkResponse({
        description: 'پروموشن با موفقیت حذف شد',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                status_code: { type: 'number', example: 200 },
                message: { type: 'string', example: 'پروموشن با موفقیت حذف شد' }
            }
        }
    })
    @ApiNotFoundResponse({
        description: 'پروموشن یافت نشد'
    })
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.deleteUseCase.execute(id);
        return {
            message: 'پروموشن با موفقیت حذف شد'
        };
    }
}
