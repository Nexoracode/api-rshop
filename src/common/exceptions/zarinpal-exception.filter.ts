import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { PaymentLog, PaymentLogStatus } from "src/modules/payment/entities/payment-logs.entity";
import { DataSource } from "typeorm";
import { ZarinpalException } from "./zarinpal-exception";

@Catch(ZarinpalException)
@Injectable()
export class ZarinpalExceptionFilter implements ExceptionFilter {
    constructor(private readonly dataSource: DataSource) { }

    async catch(exception: ZarinpalException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest<Request>();

        // اطلاعات پایه از Exception
        const { errorCode, errorMessage } = exception;

        // سعی می‌کنیم داده‌های مرتبط (order, user, payment...) رو از req بگیریم
        const order = (request as any).order ?? null;
        const user = (request as any).user ?? null;
        const payment = (request as any).payment ?? null;

        // ✅ ثبت خودکار لاگ در دیتابیس
        try {
            const repo = this.dataSource.getRepository(PaymentLog);
            await repo.save({
                user,
                order,
                payment,
                status: PaymentLogStatus.GATEWAY_ERROR,
                errorCode,
                errorMessage,
                authority: (request.query["Authority"] as string) ?? null,
                ip: request.ip,
                userAgent: request.headers["user-agent"],
            });
        } catch (err) {
            console.error("❌ Error saving Zarinpal log:", err);
        }

        // 📤 پاسخ به کلاینت
        const status = exception.getStatus();
        const responseBody = exception.getResponse();
        response.status(status).json(responseBody);
    }
}
