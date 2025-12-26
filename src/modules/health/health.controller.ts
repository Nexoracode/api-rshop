// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { CategoryCacheService } from '../category/cache';
import { Public } from 'src/common/decorator/public.decorator';

@Controller('health') // ✅ بدون 'api' prefix
export class HealthController {
    constructor(
        private categoryCacheService: CategoryCacheService,
    ) { }

    @Public()
    @Get()
    async check() {
        try {
            const redisHealth = await this.categoryCacheService.checkRedisHealth();
            return {
                status: redisHealth.isConnected ? 'ok' : 'degraded',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                redis: redisHealth,
            };
        } catch (error) {
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                error: error.message,
                redis: {
                    isConnected: false,
                    canRead: false,
                    canWrite: false,
                    storeType: 'unknown',
                    message: error.message,
                },
            };
        }
    }

    @Public()
    @Get('simple')
    simple() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'Server is running',
        };
    }
}