import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, from } from "rxjs";
import { switchMap, map } from "rxjs/operators";
import * as snakecaseKeys from "snakecase-keys";
import { instanceToPlain } from "class-transformer";

@Injectable()
export class ResponseSnakeCaseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        return next.handle().pipe(
            switchMap((data) => from(Promise.resolve(data))),
            map((resolvedData) => {
                const res = context.switchToHttp().getResponse();
                const statusCode = res.statusCode || 200;

                // اگر Entity یا کلاس باشه → تبدیل به plain object
                const plainData =
                    typeof resolvedData === "object" && resolvedData !== null
                        ? instanceToPlain(resolvedData)
                        : resolvedData;

                // اگر خروجی قبلاً خودش message + data داشته باشه
                let responseBody: any;
                if (
                    typeof plainData === "object" &&
                    plainData !== null &&
                    "data" in plainData &&
                    "message" in plainData
                ) {
                    responseBody = {
                        success: true,
                        status_code: statusCode,
                        message: plainData.message,
                        data: plainData.data,
                    };
                } else {
                    // حالت پیش‌فرض
                    responseBody = {
                        success: true,
                        status_code: statusCode,
                        message: "عملیات با موفقیت انجام شد",
                        data: plainData,
                    };
                }

                // در نهایت → snake_case روی کل خروجی
                if (typeof responseBody === "object" && responseBody !== null) {
                    return snakecaseKeys(responseBody, { deep: true });
                }

                return responseBody;
            })
        );
    }
}
