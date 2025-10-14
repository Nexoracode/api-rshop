import { HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Payment } from "src/modules/payment/entities/payment.entity";
import { ZarinpalErrorMessage } from "src/modules/payment/enums/zarinpal-message.enum";

export class ZarinpalException extends HttpException {
    private readonly logger = new Logger(ZarinpalException.name);
    public readonly errorCode: number;
    public readonly errorMessage: string;

    constructor(errorCode: number, message?: string) {
        // پیغام فارسی بر اساس جدول
        const translatedMessage =
            ZarinpalErrorMessage[errorCode] ||
            message ||
            "خطای ناشناخته در ارتباط با زرین‌پال.";

        // تعیین وضعیت HTTP
        const httpStatus =
            errorCode === 100 || errorCode === 101
                ? HttpStatus.OK
                : HttpStatus.BAD_REQUEST;

        // ارسال به HttpException
        super(
            {
                success: false,
                statusCode: httpStatus,
                errorCode,
                message: translatedMessage,
            },
            httpStatus
        );

        this.errorCode = errorCode;
        this.errorMessage = translatedMessage;

        // ثبت لاگ در لاگر NestJS (برای مشاهده در console یا فایل)
        this.logger.error(
            `[ZarinpalException] code=${errorCode} | message=${translatedMessage}`
        );
    }
}
