import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PaymentLogService } from "./payment-log.service";
import { AccessGuard } from "src/common/guard/access.guard";

@ApiTags("Payment Logs")
@Controller("payment-logs")
@UseGuards(AccessGuard)
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
