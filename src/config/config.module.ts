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
import { redisStore } from 'cache-manager-redis-yet'; // ✅ تغییر از cache-manager-redis-store
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

        // ✅ Redis Cache - آپدیت شده با cache-manager-redis-yet
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                // ✅ تنظیمات پایه برای همه محیط‌ها
                const redisConfig: any = {
                    socket: {
                        host: configService.get<string>('REDIS_HOST', 'localhost'),
                        port: configService.get<number>('REDIS_PORT', 6379),

                        // ✅ Retry Strategy
                        reconnectStrategy: (retries: number) => {
                            const delay = Math.min(retries * 50, 2000);
                            console.log(`🔄 Redis reconnect attempt ${retries}, delay: ${delay}ms`);
                            return delay;
                        },
                    },

                    // ✅ TTL به میلی‌ثانیه (300 ثانیه = 300000 ms)
                    ttl: configService.get<number>('REDIS_TTL', 300) * 1000,
                };

                // ✅ تنظیمات اضافی برای Production
                if (isProduction) {
                    const password = configService.get<string>('REDIS_PASSWORD');
                    if (password) {
                        redisConfig.password = password;
                    }

                    // Database number
                    const db = configService.get<number>('REDIS_DB', 0);
                    if (db) {
                        redisConfig.database = db;
                    }

                    // ✅ پشتیبانی از TLS (فقط اگه صریحاً true باشه)
                    const useTLS = configService.get<string>('REDIS_TLS');
                    if (useTLS === 'true') {
                        redisConfig.socket.tls = true;
                        redisConfig.socket.rejectUnauthorized = false;
                        console.log('🔒 Redis TLS enabled');
                    } else {
                        // ✅ صریحاً TLS رو غیرفعال کن
                        redisConfig.socket.tls = false;
                        console.log('🔓 Redis TLS disabled');
                    }

                    // ✅ تنظیمات امنیتی Production
                    redisConfig.enableReadyCheck = true;
                    redisConfig.maxRetriesPerRequest = 3;
                    redisConfig.enableOfflineQueue = false;
                    redisConfig.lazyConnect = false;

                    console.log('🔐 Production Redis config loaded');
                    console.log('📡 Redis Host:', configService.get<string>('REDIS_HOST'));
                    console.log('🔌 Redis Port:', configService.get<number>('REDIS_PORT'));
                }

                // ✅ ایجاد Store
                try {
                    console.log('🔄 Connecting to Redis...');
                    console.log('📋 Redis Config:', JSON.stringify({
                        host: redisConfig.socket.host,
                        port: redisConfig.socket.port,
                        tls: redisConfig.socket.tls,
                        hasPassword: !!redisConfig.password,
                        database: redisConfig.database,
                    }));

                    const store = await redisStore(redisConfig);
                    console.log('✅ Redis Store initialized successfully');

                    return {
                        store: store as any,
                        ttl: configService.get<number>('REDIS_TTL', 300) * 1000,
                        max: configService.get<number>('REDIS_MAX_ITEMS', 1000),
                    };
                } catch (error) {
                    console.error('❌ Redis Store initialization failed:', error);
                    console.error('💡 Hint: Check if Redis is running and accessible');
                    console.error('💡 Hint: If using Caprover, ensure Redis app is deployed');
                    throw error;
                }
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
