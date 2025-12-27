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
                console.log('[Redis Config] ================');
                console.log('NODE_ENV:', process.env.NODE_ENV);
                console.log('REDIS_HOST:', process.env.REDIS_HOST);
                console.log('REDIS_PORT:', process.env.REDIS_PORT);
                console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? `SET (${process.env.REDIS_PASSWORD.length} chars)` : 'NOT SET');
                console.log('REDIS_DB:', process.env.REDIS_DB);
                console.log('[Redis Config] ================');
                const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
                const redisPort = configService.get<number>('REDIS_PORT', 6379);

                try {
                    const redisUrl = `redis://${redisHost}:${redisPort}`;

                    const keyvRedisOptions: any = {
                        maxRetriesPerRequest: 3,
                    };

                    // ✅ Production settings - مستقیم به keyvRedisOptions اضافه کن
                    if (isProduction) {
                        const password = configService.get<string>('REDIS_PASSWORD');
                        if (password) {
                            keyvRedisOptions.password = password;  // ✅ اینجا
                            console.log('[Redis] Password set from env'); // debug
                        }

                        const db = configService.get<number>('REDIS_DB', 0);
                        if (db !== undefined && db !== 0) {
                            keyvRedisOptions.db = db;
                        }

                        // ⚠️ TLS باید توی socket باشه نه مستقیم
                        const useTLS = configService.get<string>('REDIS_TLS');
                        if (useTLS === 'true') {
                            keyvRedisOptions.tls = {
                                rejectUnauthorized: false,
                            };
                        }
                    } else {
                        keyvRedisOptions.db = 0;
                    }

                    console.log('[Redis] Options:', {
                        host: redisHost,
                        port: redisPort,
                        hasPassword: !!keyvRedisOptions.password,
                        db: keyvRedisOptions.db,
                        hasTLS: !!keyvRedisOptions.tls,
                    });

                    const keyvRedis = new KeyvRedis(redisUrl, keyvRedisOptions);

                    // Event listeners
                    keyvRedis.on('error', (err: Error) => {
                        console.error('[Redis Error]:', err.message);
                    });

                    keyvRedis.on('connect', () => {
                        console.log('[Redis] Connected to', redisUrl);
                    });

                    keyvRedis.on('ready', () => {
                        console.log('[Redis] Ready');
                    });

                    // Patch delete
                    const originalDelete = keyvRedis.delete.bind(keyvRedis);
                    keyvRedis.delete = async function (key: string): Promise<boolean> {
                        try {
                            if (this.redis && typeof this.redis.del === 'function') {
                                const result = await this.redis.del(key);
                                return result > 0;
                            }
                            return await originalDelete(key);
                        } catch (error) {
                            console.error('[Redis] Delete error:', error.message);
                            return false;
                        }
                    };

                    return {
                        stores: [
                            new Keyv({
                                store: keyvRedis,
                                namespace: '',
                            }),
                        ],
                        ttl: configService.get<number>('REDIS_TTL', 300) * 1000,
                        max: configService.get<number>('REDIS_MAX_ITEMS', 1000),
                    };
                } catch (error) {
                    console.error('[Redis] Connection failed:', error.message);
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
