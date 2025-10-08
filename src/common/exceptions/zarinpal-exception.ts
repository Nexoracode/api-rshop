import { BadRequestException } from "@nestjs/common";
import { ZarinpalErrorCode } from "src/modules/payment/enums/zarinpal-error.enum";
import { ZarinpalErrorMessage } from "src/modules/payment/enums/zarinpal-message.enum";

export class ZarinpalException extends BadRequestException {
    constructor(code: number, context: string) {
        const message =
            ZarinpalErrorMessage[code] ||
            "خطای ناشناخته‌ای از سمت درگاه پرداخت دریافت شد.";

        const readableCode =
            Object.keys(ZarinpalErrorCode).find(
                (key) => ZarinpalErrorCode[key as keyof typeof ZarinpalErrorCode] === code
            ) || code;

        super({
            success: false,
            source: "Zarinpal",
            context,
            code,
            errorKey: readableCode,
            message: `(${context}) ${message}`,
        });
    }
}
