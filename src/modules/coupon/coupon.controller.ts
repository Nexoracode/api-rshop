import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { CouponService } from "./coupon.service";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";
import { ApplyCouponDto } from "./dto/apply-coupon.dto";
import { Roles } from "src/common/decorator/role.decorator";
import { Role } from "src/common/enums/role.enum";
import { AccessGuard } from "src/common/guard/access.guard";
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery } from "nestjs-paginate";

@ApiTags("Coupon Management")
@Controller("coupon")
@UseGuards(AccessGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class CouponController {
  constructor(private readonly couponService: CouponService) { }

  // 🟢 ایجاد کد تخفیف جدید (برای ادمین)
  @Post()
  @ApiOperation({ summary: "ایجاد کد تخفیف جدید (ادمین)" })
  @ApiResponse({ status: 201, description: "کد تخفیف با موفقیت ایجاد شد." })
  async create(@Body() dto: CreateCouponDto) {
    return this.couponService.create(dto);
  }

  // 🟠 بروزرسانی
  @Patch(":id")
  @ApiOperation({ summary: "ویرایش کد تخفیف (ادمین)" })
  @ApiResponse({ status: 200, description: "کد تخفیف با موفقیت ویرایش شد." })
  async update(@Param("id") id: number, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(Number(id), dto);
  }

  // 🔵 اعمال کد تخفیف (برای کاربران هنگام checkout)
  @Post("apply")
  @ApiOperation({ summary: "اعمال کد تخفیف (کاربر)" })
  @ApiResponse({
    status: 200,
    description: "کد تخفیف معتبر و مبلغ تخفیف محاسبه شد.",
    schema: {
      example: {
        couponCode: "WELCOME10",
        discount: 25000,
        payable: 225000,
      },
    },
  })
  async apply(@Body() dto: ApplyCouponDto) {
    return this.couponService.apply(dto);
  }

  // 🔍 مشاهده همه کدها (ادمین)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: "مشاهده‌ی همه‌ی کدهای تخفیف (ادمین)" })
  @ApiPaginationQuery({
    sortableColumns: ['id', 'createdAt', 'startDate', 'endDate'],
    relations: ["allowedUsers", "allowedProducts", "allowedCategories"],
    defaultSortBy: [['id', 'DESC']],
    searchableColumns: ['id', 'code', 'amount'],
    filterableColumns: {
      forFirstOrder: [FilterOperator.EQ],
      isActive: [FilterOperator.EQ],
      amount: [FilterOperator.GTE, FilterOperator.LTE],
      minOrderAmount: [FilterOperator.EQ],
      type: [FilterOperator.EQ],
      usageLimit: [FilterOperator.GTE, FilterOperator.LTE],
      useCount: [FilterOperator.GTE, FilterOperator.LTE],
      createdAt: [FilterOperator.GTE, FilterOperator.LTE],
      startDate: [FilterOperator.GTE, FilterOperator.LTE],
      endDate: [FilterOperator.GTE, FilterOperator.LTE]
    },
  })
  async findAll(@Paginate() query: PaginateQuery) {
    return this.couponService.findAll(query);
  }

  // 🔍 مشاهده یک کد خاص
  @Get(":id")
  @ApiOperation({ summary: "نمایش جزئیات یک کد تخفیف (ادمین)" })
  async findOne(@Param("id") id: number) {
    return this.couponService.findOne(Number(id));
  }

  // 🔴 حذف
  @Delete(":id")
  @ApiOperation({ summary: "حذف یک کد تخفیف (ادمین)" })
  @ApiResponse({ status: 200, description: "کد تخفیف با موفقیت حذف شد." })
  async remove(@Param("id") id: number) {
    return this.couponService.remove(Number(id));
  }
}
