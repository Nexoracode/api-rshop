import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SEO_METADATA_KEY } from '../decorators/seo-meta.decorator';

@Injectable()
export class SeoInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const seoMetadata = this.reflector.get(SEO_METADATA_KEY, context.getHandler());

    if (!seoMetadata) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // اضافه کردن هدرهای SEO
        if (seoMetadata.canonical) {
          response.setHeader('Link', `<${seoMetadata.canonical}>; rel="canonical"`);
        }

        if (seoMetadata.noindex || seoMetadata.nofollow) {
          const robotsDirectives: string[] = [];
          if (seoMetadata.noindex) robotsDirectives.push('noindex');
          if (seoMetadata.nofollow) robotsDirectives.push('nofollow');
          response.setHeader('X-Robots-Tag', robotsDirectives.join(', '));
        }

        // اضافه کردن متادیتا به response
        return {
          ...data,
          seo: seoMetadata,
        };
      }),
    );
  }
}