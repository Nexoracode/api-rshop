import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { from, map, Observable, switchMap } from "rxjs";
import * as snakecaseKeys from 'snakecase-keys';
import { mapKeys, camelCase } from 'lodash'
import { instanceToPlain } from "class-transformer";
@Injectable()
export class SnakeToCamelInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        if (request.body && typeof request.body === 'object') {
            request.body = this.transformKeysToCamelCase(request.body);
        }
        return next.handle();
    }

    private transformKeysToCamelCase(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map((v) => this.transformKeysToCamelCase(v));
        } else if (obj && typeof obj === 'object') {
            return Object.fromEntries(
                Object.entries(obj).map(([key, value]) => [
                    camelCase(key),
                    this.transformKeysToCamelCase(value),
                ]),
            );
        }
        return obj;
    }
}