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
import { redisStore } from 'cache-manager-redis-store';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOption),
        AuthModule,
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || "development"}`
        }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') }
            }),
        }),
        CacheModule.register({
            store: redisStore,
            host: 'localhost',
            port: 6379,
            ttl: 300,
            max: 1000,
        }),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 20,
        }])
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard
        },
        {
            provide: APP_FILTER,
            useClass: ZarinpalExceptionFilter,
        },
        {
            provide: APP_GUARD,
            useFactory: (configService: JwtUtil, authService: AuthService, reflector: Reflector) => new AutoRefreshGuard(configService, authService, reflector),
            inject: [JwtUtil, AuthService, Reflector],
        },
        JwtUtil,
        ConfigService,
        AccessStrategy,
        RefreshStrategy,
    ],
    exports: [ConfigService]
})
export class AppConfigModule { }
