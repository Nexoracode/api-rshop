// src/common/filters/http-exception.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'خطای داخلی سرور';
        let error = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object') {
                message = (exceptionResponse as any).message || message;
                error = (exceptionResponse as any).error || error;
            } else {
                message = exceptionResponse;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            error = exception.name;

            // ✅ لاگ خطاهای Redis
            if (message.includes('Redis') || message.includes('ECONNREFUSED')) {
                this.logger.error(`❌ [Redis Error] ${message}`);
                message = 'خطا در اتصال به کش. لطفاً دوباره تلاش کنید';
            }
        }

        this.logger.error(
            `❌ [${request.method}] ${request.url} - Status: ${status} - Error: ${message}`,
            exception instanceof Error ? exception.stack : ''
        );

        // ✅ همیشه JSON برمی‌گردونه، نه HTML
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
            error,
        });
    }
}