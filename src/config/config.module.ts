import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOption } from 'db/data-source';
import { JwtModule } from '@nestjs/jwt';
import { AccessStrategy } from 'src/common/guard/access.strategy';
import { RefreshStrategy } from 'src/common/guard/refresh.strategy';
import { AuthModule } from 'src/modules/auth/auth.module';
import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core';
import { JwtUtil } from 'src/common/utils/jwt.util';
import { AuthService } from 'src/modules/auth/auth.service';
import { AutoRefreshGuard } from 'src/common/guard/auto-refresh';
import { ZarinpalExceptionFilter } from 'src/common/exceptions/zarinpal-exception.filter';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// تشخیص محیط اجرا
const isProduction = process.env.NODE_ENV === 'production';

@Module({
    imports: [
        // TypeORM Configuration
        TypeOrmModule.forRoot(dataSourceOption),

        // Auth Module
        AuthModule,

        // Config Module - Global
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || "development"}`,
            cache: true, // کش کردن env variables برای بهبود performance
        }),

        // JWT Module - با تنظیمات متفاوت برای dev/prod
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            global: true,
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRATION'),
                    issuer: 'rshop-api',
                    audience: 'rshop-client',
                }
            }),
        }),

        // Redis Cache - با تنظیمات متفاوت برای dev/prod
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const config: any = {
                    store: redisStore as any,
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                    ttl: configService.get<number>('REDIS_TTL', 300),
                    max: configService.get<number>('REDIS_MAX_ITEMS', 1000),
                };

                // تنظیمات اضافی برای production
                if (isProduction) {
                    config.password = configService.get<string>('REDIS_PASSWORD');
                    config.db = configService.get<number>('REDIS_DB', 0);

                    // پشتیبانی از TLS در production
                    if (configService.get<boolean>('REDIS_TLS')) {
                        config.tls = {};
                    }

                    // Retry strategy برای production
                    config.retryStrategy = (times: number) => {
                        const delay = Math.min(times * 50, 2000);
                        return delay;
                    };
                    config.enableReadyCheck = true;
                    config.maxRetriesPerRequest = 3;
                }

                return config;
            },
        }),

        // Rate Limiting - فقط در production
        ...(isProduction ? [
            ThrottlerModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => [{
                    ttl: configService.get<number>('THROTTLE_TTL', 60000), // 60 ثانیه
                    limit: configService.get<number>('THROTTLE_LIMIT', 100), // 100 درخواست
                    // نادیده گرفتن بات‌های جستجوگر
                    ignoreUserAgents: [
                        /googlebot/gi,
                        /bingbot/gi,
                    ],
                }]
            })
        ] : []),
    ],
    providers: [
        // Rate Limiting Guard - فقط در production
        ...(isProduction ? [
            {
                provide: APP_GUARD,
                useClass: ThrottlerGuard
            }
        ] : []),

        // Exception Filter - برای همه محیط‌ها
        {
            provide: APP_FILTER,
            useClass: ZarinpalExceptionFilter,
        },

        // Auto Refresh Guard - برای همه محیط‌ها
        {
            provide: APP_GUARD,
            useFactory: (
                jwtUtil: JwtUtil,
                authService: AuthService,
                reflector: Reflector
            ) => new AutoRefreshGuard(jwtUtil, authService, reflector),
            inject: [JwtUtil, AuthService, Reflector],
        },

        // Utilities and Strategies
        JwtUtil,
        ConfigService,
        AccessStrategy,
        RefreshStrategy,
    ],
    exports: [ConfigService]
})
export class AppConfigModule {
    constructor() {
        // لاگ کردن تنظیمات هنگام شروع
        console.log('🚀 RSHOP API Configuration');
        console.log('📝 Environment:', process.env.NODE_ENV || 'development');
        console.log('🔒 Rate Limiting:', isProduction ? 'Enabled ✅' : 'Disabled ❌');
        console.log('💾 Redis Cache:', 'Enabled ✅');
        console.log('🔑 JWT:', 'Enabled ✅');
        console.log('=======================================');
    }
}