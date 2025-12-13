import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'خطایی در سرور رخ داده است';
        let errors: Record<string, string[]> | null | string = exception.toString();


        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();

            if (typeof res === 'string') {
                message = res;
            } else if (typeof res === 'object' && res !== null) {
                const resObj = res as any;
                message = resObj.message || message;

                // handle validation error message array
                if (Array.isArray(resObj.message)) {
                    if (resObj.message[0]?.constraints) {
                        errors = this.formatValidationErrors(resObj.message);
                    } else {
                        errors = resObj.message;
                    }
                }
            }
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            message,
            errors,
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }

    private formatValidationErrors(messages: any[]) {
        const result: Record<string, string[]> = {};

        for (const msg of messages) {
            if (msg.constraints) {
                result[msg.property] = Object.values(msg.constraints);
            }
        }

        return result;
    }
}
