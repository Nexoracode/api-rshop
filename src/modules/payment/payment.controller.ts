import { Controller, Post, Query, Body, Req } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PaymentService } from "./payment.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { Request } from "express";
import { User } from "../user/entities/user.entity";

@ApiTags("Payment")
@Controller("payment")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  // 🟢 شروع پرداخت
  @Post("create")
  @ApiOperation({ summary: "ایجاد لینک پرداخت برای سفارش" })
  async createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentService.createPayment(dto.orderId);
  }

  // 🔵 بازگشت از درگاه پرداخت (callback)
  @Post("verify")
  @ApiOperation({ summary: "تأیید پرداخت بعد از بازگشت از درگاه" })
  async verifyPayment(
    @Req() req: Request,
    @Query("orderId") orderId: number,
    @Query("Authority") authority: string,
    @Query("Status") status: string
  ) {
    return this.paymentService.verifyPayment(orderId, authority, status, req);
  }
}
