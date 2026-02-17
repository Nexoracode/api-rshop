import { Controller, Post, Query, Body, Req, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PaymentService } from "./payment.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { Request } from "express";
import { Paginate, PaginateQuery } from "nestjs-paginate";
import { AccessGuard } from "src/common/guard/access.guard";
import { RoleGuard } from "src/common/guard/role.guard";
import { Roles } from "src/common/decorator/role.decorator";
import { Role } from "src/common/enums/role.enum";
import { Public } from "src/common/decorator/public.decorator";

@ApiTags("Payment")
@Controller("payment")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  // 🟢 شروع پرداخت — کاربر لاگین‌کرده
  @UseGuards(AccessGuard)
  @ApiBearerAuth()
  @Post("create")
  @ApiOperation({ summary: "ایجاد لینک پرداخت برای سفارش" })
  async createPayment(@Body() dto: CreatePaymentDto, @Req() req: Request) {
    return this.paymentService.createPayment(dto.callback, dto.orderId, req);
  }

  // 🔵 بازگشت از درگاه پرداخت — public (callback از Zarinpal)
  @Public()
  @Post("verify")
  @ApiOperation({
    summary: "تأیید پرداخت بعد از بازگشت از درگاه", description:
      `هنگام وریفای یک code ارسال میشود که هرکدام بیان گر یک چیزیست

**انواع کد ها (code):**
- \`100\`: لینک درگاه ساخته شد
- \`101\`: این تراکنش قبلا پرداخت شده است
- \`-50\`: پرداخت توسط کاربر لغو شد.
- \`102\`: پرداخت با موفقیت انجام شد و فاکتور ساخته شد.
- \`103\`: پرداخت تایید شد اما فاکتور صادر نشد.
- \`-51\`: پرداخت ناموفق بود.
 
    `
  })
  async verifyPayment(
    @Req() req: Request,
    @Query("Authority") authority: string,
    @Query("Status") status: string
  ) {
    return this.paymentService.verifyPayment(authority, status, req);
  }

  // 🔵 لیست پرداخت‌ها — فقط ادمین
  @UseGuards(AccessGuard, RoleGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.MANAGER)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: "لیست تمام پرداخت‌ها (ادمین)" })
  async getAllPayment(@Paginate() query: PaginateQuery) {
    return this.paymentService.getAllPayment(query);
  }
}
