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
import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

// تشخیص محیط اجرا
const isProduction = process.env.NODE_ENV === 'production';

@Module({
    imports: [
        AuthModule,
        ScheduleModule.forRoot(),
        // ✅ فعال‌سازی Event-Driven Architecture
        EventEmitterModule.forRoot({
            // استفاده از wildcard
            wildcard: false,
            // حداکثر تعداد listener ها
            maxListeners: 10,
            // نمایش warning در صورت memory leak
            verboseMemoryLeak: true,
        }),
        TypeOrmModule.forRoot(dataSourceOption),
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || "development"}`,
            cache: true,
        }),
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

        // ✅ Redis Cache - ساده و کاربردی
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                // تنظیمات پایه redis (همیشگی)
                const redisConfig: any = {
                    socket: {
                        host: configService.get<string>('REDIS_HOST', 'localhost'),
                        port: configService.get<number>('REDIS_PORT', 6379),
                    },
                };

                // فقط در production تنظیمات اضافی اضافه می‌شه (دقیقاً مثل کد قبلی)
                if (isProduction) {
                    const password = configService.get<string>('REDIS_PASSWORD');
                    if (password) {
                        redisConfig.password = password;
                    }
                    const db = configService.get<number>('REDIS_DB', 0);
                    if (db !== undefined && db !== 0) { // فقط اگر صریحاً ست شده باشه (مثل کد قبلی)
                        redisConfig.database = db;
                    }
                    const useTLS = configService.get<string>('REDIS_TLS');
                    if (useTLS === 'true') {
                        redisConfig.socket.tls = true;
                        redisConfig.socket.rejectUnauthorized = false;
                    }
                }

                try {
                    // ساخت URL یا گزینه‌های اتصال برای KeyvRedis
                    const redisUrl = `redis://${redisConfig.socket.host}:${redisConfig.socket.port}`;

                    const keyvRedisOptions: any = {};

                    // فقط اگر در production تعریف شده باشه، اضافه کن
                    if (isProduction) {
                        if (redisConfig.password) {
                            keyvRedisOptions.password = redisConfig.password;
                        }
                        if (redisConfig.database !== undefined) {
                            keyvRedisOptions.db = redisConfig.database;
                        }
                    } else {
                        // در development صریحاً db=0 (اختیاری، ولی برای اطمینان)
                        keyvRedisOptions.db = 0;
                    }

                    const keyvRedis = new KeyvRedis(redisUrl, keyvRedisOptions);

                    console.log('✅ Redis connected successfully (KeyvRedis)');

                    return {
                        stores: [
                            new Keyv({
                                store: keyvRedis,
                                namespace: 'rshop',
                            }),
                        ],
                        ttl: configService.get<number>('REDIS_TTL', 300) * 1000,
                        max: configService.get<number>('REDIS_MAX_ITEMS', 1000),
                    };
                } catch (error) {
                    console.error('❌ Redis connection failed:', error.message);
                    console.warn('⚠️ Falling back to memory cache');
                    return {
                        ttl: configService.get<number>('REDIS_TTL', 300) * 1000,
                        max: configService.get<number>('REDIS_MAX_ITEMS', 1000),
                    };
                }
            },
        }),

        ...(isProduction ? [
            ThrottlerModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => [{
                    ttl: configService.get<number>('THROTTLE_TTL', 60000),
                    limit: configService.get<number>('THROTTLE_LIMIT', 100),
                    ignoreUserAgents: [/googlebot/gi, /bingbot/gi],
                }]
            })
        ] : []),
    ],
    providers: [
        ...(isProduction ? [{
            provide: APP_GUARD,
            useClass: ThrottlerGuard
        }] : []),
        {
            provide: APP_FILTER,
            useClass: ZarinpalExceptionFilter,
        },
        {
            provide: APP_GUARD,
            useFactory: (
                jwtUtil: JwtUtil,
                authService: AuthService,
                reflector: Reflector
            ) => new AutoRefreshGuard(jwtUtil, authService, reflector),
            inject: [JwtUtil, AuthService, Reflector],
        },
        JwtUtil,
        ConfigService,
        AccessStrategy,
        RefreshStrategy,
    ],
    exports: [ConfigService]
})
export class AppConfigModule {
    constructor() {
        console.log('🚀 RSHOP API started successfully');
    }
}
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { dataSourceOption } from 'db/data-source';
// import { JwtModule } from '@nestjs/jwt';
// import { AccessStrategy } from 'src/common/guard/access.strategy';
// import { RefreshStrategy } from 'src/common/guard/refresh.strategy';
// import { AuthModule } from 'src/modules/auth/auth.module';
// import { APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core';
// import { JwtUtil } from 'src/common/utils/jwt.util';
// import { AuthService } from 'src/modules/auth/auth.service';
// import { AutoRefreshGuard } from 'src/common/guard/auto-refresh';
// import { ZarinpalExceptionFilter } from 'src/common/exceptions/zarinpal-exception.filter';
// import { CacheModule } from '@nestjs/cache-manager';
// import { redisStore } from 'cache-manager-redis-yet';
// import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// // تشخیص محیط اجرا
// const isProduction = process.env.NODE_ENV === 'production';

// @Module({
//     imports: [
//         TypeOrmModule.forRoot(dataSourceOption),
//         AuthModule,
//         ConfigModule.forRoot({
//             isGlobal: true,
//             envFilePath: `.env.${process.env.NODE_ENV || "development"}`,
//             cache: true,
//         }),
//         JwtModule.registerAsync({
//             imports: [ConfigModule],
//             inject: [ConfigService],
//             global: true,
//             useFactory: (configService: ConfigService) => ({
//                 secret: configService.get<string>('JWT_SECRET'),
//                 signOptions: {
//                     expiresIn: configService.get<string>('JWT_EXPIRATION'),
//                     issuer: 'rshop-api',
//                     audience: 'rshop-client',
//                 }
//             }),
//         }),

//         // ✅ Redis Cache - ساده و کاربردی
//         CacheModule.registerAsync({
//             isGlobal: true,
//             imports: [ConfigModule],
//             inject: [ConfigService],
//             useFactory: async (configService: ConfigService) => {
//                 const redisConfig: any = {
//                     socket: {
//                         host: configService.get<string>('REDIS_HOST', 'localhost'),
//                         port: configService.get<number>('REDIS_PORT', 6379),
//                     },
//                 };

//                 if (isProduction) {
//                     const password = configService.get<string>('REDIS_PASSWORD');
//                     if (password) {
//                         redisConfig.password = password;
//                     }
//                     const db = configService.get<number>('REDIS_DB', 0);
//                     if (db) {
//                         redisConfig.database = db;
//                     }
//                     const useTLS = configService.get<string>('REDIS_TLS');
//                     if (useTLS === 'true') {
//                         redisConfig.socket.tls = true;
//                         redisConfig.socket.rejectUnauthorized = false;
//                     }
//                 }

//                 try {
//                     const store = await redisStore(redisConfig);
//                     console.log('✅ Redis connected successfully'); // ← این خط جدید

//                     return {
//                         store: store as any,
//                         // ttl: configService.get<number>('REDIS_TTL', 300) * 1000,
//                         ttl: 0,
//                         max: configService.get<number>('REDIS_MAX_ITEMS', 1000),
//                     };
//                 } catch (error) {
//                     console.error('❌ Redis connection failed:', error.message);
//                     console.warn('⚠️ Falling back to memory cache');
//                     return {
//                         // ttl: configService.get<number>('REDIS_TTL', 300) * 1000,
//                         ttl: 0,
//                         max: configService.get<number>('REDIS_MAX_ITEMS', 1000),
//                     };
//                 }
//             },
//         }),

//         ...(isProduction ? [
//             ThrottlerModule.forRootAsync({
//                 imports: [ConfigModule],
//                 inject: [ConfigService],
//                 useFactory: (configService: ConfigService) => [{
//                     ttl: configService.get<number>('THROTTLE_TTL', 60000),
//                     limit: configService.get<number>('THROTTLE_LIMIT', 100),
//                     ignoreUserAgents: [/googlebot/gi, /bingbot/gi],
//                 }]
//             })
//         ] : []),
//     ],
//     providers: [
//         ...(isProduction ? [{
//             provide: APP_GUARD,
//             useClass: ThrottlerGuard
//         }] : []),
//         {
//             provide: APP_FILTER,
//             useClass: ZarinpalExceptionFilter,
//         },
//         {
//             provide: APP_GUARD,
//             useFactory: (
//                 jwtUtil: JwtUtil,
//                 authService: AuthService,
//                 reflector: Reflector
//             ) => new AutoRefreshGuard(jwtUtil, authService, reflector),
//             inject: [JwtUtil, AuthService, Reflector],
//         },
//         JwtUtil,
//         ConfigService,
//         AccessStrategy,
//         RefreshStrategy,
//     ],
//     exports: [ConfigService]
// })
// export class AppConfigModule {
//     constructor() {
//         console.log('🚀 RSHOP API started successfully');
//     }
// }
