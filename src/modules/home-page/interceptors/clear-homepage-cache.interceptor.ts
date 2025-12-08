import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HomePageService } from '../home-page.service';

/**
 * اینترسپتوری که بعد از تغییرات در محتوای صفحه اصلی، کش را پاک می‌کند
 */
@Injectable()
export class ClearHomePageCacheInterceptor implements NestInterceptor {
  constructor(private readonly homePageService: HomePageService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async () => {
        // بعد از موفقیت‌آمیز بودن عملیات، کش را پاک کن
        await this.homePageService.clearCache();
      }),
    );
  }
}
