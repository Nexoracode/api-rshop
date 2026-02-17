import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PaymentLogService } from "./payment-log.service";
import { AccessGuard } from "src/common/guard/access.guard";
import { RoleGuard } from "src/common/guard/role.guard";
import { Roles } from "src/common/decorator/role.decorator";
import { Role } from "src/common/enums/role.enum";

@ApiTags("Payment Logs")
@ApiBearerAuth()
@Controller("payment-logs")
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER)
export class PaymentLogController {
    constructor(private readonly paymentLogService: PaymentLogService) { }

    // 🟢 مشاهده تمام لاگ‌ها
    @Get()
    @ApiOperation({
        summary: "لیست تمام لاگ‌های پرداخت (ادمین)",
        description:
            "این متد همه‌ی تراکنش‌های ثبت‌شده (موفق، ناموفق، لغوشده) را برمی‌گرداند.",
    })
    @ApiResponse({
        status: 200,
        description: "لیست لاگ‌ها با جزئیات",
    })
    async getAll() {
        return this.paymentLogService.getAllLogs();
    }

    // 🔍 مشاهده لاگ‌های مربوط به یک سفارش
    @Get(":orderId")
    @ApiOperation({
        summary: "مشاهده لاگ‌های پرداخت برای یک سفارش خاص",
        description:
            "با وارد کردن شناسه سفارش، جزئیات تمام تراکنش‌های آن را مشاهده کنید.",
    })
    @ApiResponse({
        status: 200,
        description: "لیست لاگ‌های مربوط به سفارش",
    })
    async getByOrder(@Param("orderId") orderId: number) {
        return this.paymentLogService.getLogByOrder(orderId);
    }
}
