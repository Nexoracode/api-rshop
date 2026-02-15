import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HomePageCacheService } from '../cache/home-page-cache.service';

/**
 * اینترسپتور پاک‌سازی cache صفحه اصلی
 * 
 * بعد از هر تغییر در محتوای صفحه اصلی (Hero Sliders, Side Banners, Promo Banners, Home Sections)
 * این interceptor به صورت خودکار کش را پاک می‌کند.
 * 
 * استفاده:
 * @UseInterceptors(ClearHomePageCacheInterceptor)
 */
@Injectable()
export class ClearHomePageCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ClearHomePageCacheInterceptor.name);

  constructor(private readonly cacheService: HomePageCacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async () => {
        try {
          // ✅ پاک کردن کامل cache صفحه اصلی
          await this.cacheService.clearHomePageData();
          this.logger.log('🗑️ Cache صفحه اصلی توسط interceptor پاک شد');
        } catch (error) {
          this.logger.error('❌ خطا در پاک کردن cache توسط interceptor:', error);
        }
      }),
    );
  }
}
