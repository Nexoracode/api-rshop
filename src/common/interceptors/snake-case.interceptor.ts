import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";
import * as snakecaseKeys from 'snakecase-keys';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        return next.handle().pipe(
            map((data) => snakecaseKeys(data, { deep: true }))
        )
    }
}