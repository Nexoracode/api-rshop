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
        EventEmitterModule.forRoot({
            wildcard: false,
            maxListeners: 10,
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

        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const isProduction = process.env.NODE_ENV === 'production';

                // console.log('[Redis Config] ================');
                // console.log('NODE_ENV:', process.env.NODE_ENV);
                // console.log('REDIS_HOST:', process.env.REDIS_HOST);
                // console.log('REDIS_PORT:', process.env.REDIS_PORT);
                // console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? `SET (${process.env.REDIS_PASSWORD.length} chars)` : 'NOT SET');
                // console.log('REDIS_DB:', process.env.REDIS_DB);
                // console.log('[Redis Config] ================');

                try {
                    let redisUrl: string;
                    let keyvRedisOptions: any = {
                        maxRetriesPerRequest: 3,
                        connectTimeout: 10000,
                        enableReadyCheck: true,
                    };

                    if (isProduction) {
                        // ✅ روش درست برای production - ساخت URL با رمز عبور
                        const password = configService.get<string>('REDIS_PASSWORD');
                        const host = configService.get<string>('REDIS_HOST', 'localhost');
                        const port = configService.get<number>('REDIS_PORT', 6379);
                        const db = configService.get<number>('REDIS_DB', 0);

                        if (password) {
                            // ساخت URL با احراز هویت
                            redisUrl = `redis://:${encodeURIComponent(password)}@${host}:${port}/${db}`;
                        } else {
                            redisUrl = `redis://${host}:${port}/${db}`;
                        }

                        // ✅ تنظیمات TLS برای production
                        const useTLS = configService.get<string>('REDIS_TLS');
                        if (useTLS === 'true') {
                            redisUrl = redisUrl.replace('redis://', 'rediss://');
                            keyvRedisOptions.tls = {
                                rejectUnauthorized: false,
                            };
                        }

                        // console.log('[Redis Production] Using URL:', redisUrl.replace(/:([^@]+)@/, ':****@')); // برای امنیت
                    } else {
                        // ✅ Development - بدون رمز عبور
                        const host = configService.get<string>('REDIS_HOST', 'localhost');
                        const port = configService.get<number>('REDIS_PORT', 6379);
                        const db = configService.get<number>('REDIS_DB', 0);
                        redisUrl = `redis://${host}:${port}/${db}`;
                        // console.log('[Redis Development] Using URL:', redisUrl);
                    }

                    // ایجاد اتصال Redis
                    const keyvRedis = new KeyvRedis(redisUrl, keyvRedisOptions);

                    // Event listeners برای دیباگ
                    keyvRedis.on('error', (err: Error) => {
                        console.error('[Redis Connection Error]:', err.message);
                    });

                    keyvRedis.on('connect', () => {
                        console.log('[Redis] Connected successfully');
                    });

                    keyvRedis.on('ready', () => {
                        console.log('[Redis] Connection ready');
                    });
                    keyvRedis.on('end', () => {
                        console.log('[Redis] Connection ended');
                    });

                    // Patch delete برای خطایابی بهتر
                    const originalDelete = keyvRedis.delete.bind(keyvRedis);
                    keyvRedis.delete = async function (key: string): Promise<boolean> {
                        try {
                            if (this.redis && typeof this.redis.del === 'function') {
                                const result = await this.redis.del(key);
                                return result > 0;
                            }
                            return await originalDelete(key);
                        } catch (error: any) {
                            console.error('[Redis Delete Error]:', error.message);
                            return false;
                        }
                    };

                    return {
                        stores: [
                            new Keyv({
                                store: keyvRedis,
                                namespace: 'rshop',
                                ttl: configService.get<number>('REDIS_TTL', 300) * 1000,
                            }),
                        ],
                        ttl: configService.get<number>('REDIS_TTL', 300) * 1000,
                        max: configService.get<number>('REDIS_MAX_ITEMS', 1000),
                    };
                } catch (error: any) {
                    console.error('[Redis] Connection setup failed:', error.message);
                    console.warn('[Cache] Falling back to Memory Cache');

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
                    limit: configService.get<number>('THROTTLE_LIMIT', 5000),
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