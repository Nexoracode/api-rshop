// src/health/health.controller.ts
import { Controller, Get, Delete, Query, Body, Post, UseGuards } from '@nestjs/common';
import { CategoryCacheService } from '../category/cache';
import { Public } from 'src/common/decorator/public.decorator';
import { CollectionCacheService } from '../collection/cache/collection-cache.service';
import { CatalogCacheService } from '../catalogs/cache';
import { HomePageCacheService } from '../home-page/cache';
import { OrderCacheService } from '../order/cache/order-cache.service';
import { ProductCacheService } from '../product/cache';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@Controller('health')
export class HealthController {
    constructor(
        private categoryCacheService: CategoryCacheService,
        private productCacheService: ProductCacheService,
        private orderCacheService: OrderCacheService,
        private homePageCacheService: HomePageCacheService,
        private catalogCacheService: CatalogCacheService,
        private collectionCacheService: CollectionCacheService,
    ) { }

    // ==================== Public Health Checks ====================

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

    // ==================== Admin: Cache Keys Management ====================

    /**
     * دریافت تمام کلیدهای Redis
     * محافظت شده با JWT + Role Admin
     */
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN)
    @Get('cache/keys')
    async getAllCacheKeys(
        @Query('pattern') pattern?: string,
        @Query('limit') limit?: string,
    ) {
        try {
            const store: any = (this.categoryCacheService as any).cacheManager.stores;

            if (!Array.isArray(store) || store.length === 0) {
                return {
                    success: false,
                    message: 'Store not found',
                };
            }

            const redisClient = store[0]?.opts?.store?.client;

            if (!redisClient || typeof redisClient.keys !== 'function') {
                return {
                    success: false,
                    message: 'Redis client not available',
                };
            }

            // Pattern پیش‌فرض: همه کلیدها
            const searchPattern = pattern || '*';
            const namespace = 'rshop';
            const fullPattern = `${namespace}:${searchPattern}`;

            const keys = await redisClient.keys(fullPattern);
            const maxLimit = limit || 100;

            // گرفتن sample از values
            const keysWithDetails = await Promise.all(
                keys.slice(0, maxLimit).map(async (key: string) => {
                    try {
                        const ttl = await redisClient.ttl(key);
                        const type = await redisClient.type(key);

                        return {
                            key: key.replace(`${namespace}:`, ''), // حذف namespace برای خوانایی
                            fullKey: key,
                            ttl: ttl > 0 ? ttl : 'no expiry',
                            type,
                        };
                    } catch (e) {
                        return {
                            key: key.replace(`${namespace}:`, ''),
                            fullKey: key,
                            error: e.message,
                        };
                    }
                })
            );

            return {
                success: true,
                totalKeys: keys.length,
                returnedKeys: keysWithDetails.length,
                pattern: searchPattern,
                fullPattern,
                keys: keysWithDetails,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                stack: error.stack,
            };
        }
    }

    /**
     * دریافت آمار کلی cache
     */
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN)
    @Get('cache/stats')
    async getCacheStats() {
        try {
            const [
                categoryStats,
                productStats,
                orderStats,
                homePageStats,
                catalogStats,
                collectionStats,
            ] = await Promise.all([
                this.categoryCacheService.getCacheStats(),
                this.productCacheService.getCacheStats(),
                this.orderCacheService.getCacheStats(),
                this.homePageCacheService.getCacheStats(),
                this.catalogCacheService.getCacheStats(),
                this.collectionCacheService.getCacheStats(),
            ]);

            const total =
                categoryStats.totalKeys +
                productStats.totalKeys +
                orderStats.totalKeys +
                homePageStats.totalKeys +
                catalogStats.totalKeys +
                collectionStats.totalKeys;

            return {
                success: true,
                timestamp: new Date().toISOString(),
                total: {
                    keys: total,
                },
                byModule: {
                    category: categoryStats,
                    product: productStats,
                    order: orderStats,
                    homePage: homePageStats,
                    catalog: catalogStats,
                    collection: collectionStats,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * دریافت مقدار یک کلید خاص
     */
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN)
    @Get('cache/get')
    async getCacheValue(@Query('key') key: string) {
        if (!key) {
            return {
                success: false,
                message: 'Key parameter is required',
            };
        }

        try {
            const store: any = (this.categoryCacheService as any).cacheManager.stores;

            if (!Array.isArray(store) || store.length === 0) {
                return {
                    success: false,
                    message: 'Store not found',
                };
            }

            const redisClient = store[0]?.opts?.store?.client;

            if (!redisClient) {
                return {
                    success: false,
                    message: 'Redis client not available',
                };
            }

            const namespace = 'rshop';
            const fullKey = `${namespace}:${key}`;

            const value = await redisClient.get(fullKey);
            const ttl = await redisClient.ttl(fullKey);
            const type = await redisClient.type(fullKey);

            if (!value) {
                return {
                    success: false,
                    message: 'Key not found',
                    key: key,
                    fullKey: fullKey,
                };
            }

            // تلاش برای parse کردن JSON
            let parsedValue;
            try {
                parsedValue = JSON.parse(value);
            } catch (e) {
                parsedValue = value;
            }

            return {
                success: true,
                key: key,
                fullKey: fullKey,
                value: parsedValue,
                rawValue: value,
                ttl: ttl > 0 ? ttl : 'no expiry',
                type,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // ==================== Admin: Cache Deletion ====================

    /**
     * پاک کردن یک کلید خاص
     */
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN)
    @Delete('cache/key')
    async deleteCacheKey(@Query('key') key: string) {
        if (!key) {
            return {
                success: false,
                message: 'Key parameter is required',
            };
        }

        try {
            const cacheManager: any = (this.categoryCacheService as any).cacheManager;

            await cacheManager.del(key);

            return {
                success: true,
                message: `Key "${key}" deleted successfully`,
                deletedKey: key,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * پاک کردن چندین کلید با pattern
     */
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN)
    @Delete('cache/pattern')
    async deleteCacheByPattern(@Query('pattern') pattern: string) {
        if (!pattern) {
            return {
                success: false,
                message: 'Pattern parameter is required',
            };
        }

        try {
            const store: any = (this.categoryCacheService as any).cacheManager.stores;

            if (!Array.isArray(store) || store.length === 0) {
                return {
                    success: false,
                    message: 'Store not found',
                };
            }

            const redisClient = store[0]?.opts?.store?.client;

            if (!redisClient || typeof redisClient.keys !== 'function') {
                return {
                    success: false,
                    message: 'Redis client not available',
                };
            }

            const namespace = 'rshop';
            const fullPattern = `${namespace}:${pattern}`;
            const keys = await redisClient.keys(fullPattern);

            if (keys.length === 0) {
                return {
                    success: true,
                    message: 'No keys found matching pattern',
                    pattern: pattern,
                    deletedCount: 0,
                };
            }

            // استفاده از Pipeline برای حذف سریع
            const pipeline = redisClient.pipeline();
            keys.forEach((key: string) => pipeline.del(key));
            await pipeline.exec();

            return {
                success: true,
                message: `Deleted ${keys.length} keys`,
                pattern: pattern,
                fullPattern: fullPattern,
                deletedCount: keys.length,
                deletedKeys: keys.map((k: string) => k.replace(`${namespace}:`, '')),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * پاک کردن cache یک ماژول خاص
     */
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN)
    @Delete('cache/module/:module')
    async clearModuleCache(@Query('module') module: string) {
        if (!module) {
            return {
                success: false,
                message: 'Module parameter is required',
            };
        }

        try {
            const moduleMap: Record<string, () => Promise<void>> = {
                category: () => this.categoryCacheService.clearAllCategoryCache(),
                product: () => this.productCacheService.clearAllProductCache(),
                order: () => this.orderCacheService.clearAllOrderCache(),
                homepage: () => this.homePageCacheService.clearAllHomePageCache(),
                catalog: () => this.catalogCacheService.clearAllCatalogCache(),
                collection: () => this.collectionCacheService.clearAllCollectionCache(),
            };

            const clearFunction = moduleMap[module.toLowerCase()];

            if (!clearFunction) {
                return {
                    success: false,
                    message: `Unknown module: ${module}`,
                    availableModules: Object.keys(moduleMap),
                };
            }

            await clearFunction();

            return {
                success: true,
                message: `All cache for module "${module}" cleared successfully`,
                module: module,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * پاک کردن تمام cache ها
     */
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN)
    @Delete('cache/all')
    async clearAllCache() {
        try {
            await Promise.all([
                this.categoryCacheService.clearAllCategoryCache(),
                this.productCacheService.clearAllProductCache(),
                this.orderCacheService.clearAllOrderCache(),
                this.homePageCacheService.clearAllHomePageCache(),
                this.catalogCacheService.clearAllCatalogCache(),
                this.collectionCacheService.clearAllCollectionCache(),
            ]);

            return {
                success: true,
                message: 'All cache cleared successfully',
                clearedModules: [
                    'category',
                    'product',
                    'order',
                    'homepage',
                    'catalog',
                    'collection',
                ],
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * پاک کردن کامل Redis (FLUSHDB) - خطرناک!
     */
    @UseGuards(AccessGuard, RoleGuard)
    @Roles(Role.SUPER_ADMIN)
    @Delete('cache/flush')
    async flushRedis(@Query('confirm') confirm: string) {
        if (confirm !== 'yes-i-am-sure') {
            return {
                success: false,
                message: 'This is a dangerous operation. Add ?confirm=yes-i-am-sure to proceed',
            };
        }

        try {
            const store: any = (this.categoryCacheService as any).cacheManager.stores;

            if (!Array.isArray(store) || store.length === 0) {
                return {
                    success: false,
                    message: 'Store not found',
                };
            }

            const redisClient = store[0]?.opts?.store?.client;

            if (!redisClient || typeof redisClient.flushdb !== 'function') {
                return {
                    success: false,
                    message: 'Redis client not available',
                };
            }

            await redisClient.flushdb();

            return {
                success: true,
                message: '⚠️ ENTIRE Redis database flushed! All keys deleted.',
                warning: 'This operation cannot be undone!',
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    @Get('redis-connection-info')
    async redisConnectionInfo() {
        try {
            const store: any = (this.categoryCacheService as any).cacheManager.stores;

            if (Array.isArray(store) && store.length > 0) {
                const redisClient = store[0]?.opts?.store?.client;

                if (redisClient) {
                    const connectionInfo = {
                        host: redisClient.options?.host || 'unknown',
                        port: redisClient.options?.port || 'unknown',
                        db: redisClient.options?.db || 'unknown',
                        password: redisClient.options?.password ? '***' : 'none',
                    };

                    let serverInfo = 'N/A';
                    try {
                        if (typeof redisClient.info === 'function') {
                            serverInfo = await redisClient.info('server');
                        } else if (typeof redisClient.sendCommand === 'function') {
                            serverInfo = await redisClient.sendCommand(['INFO', 'server']);
                        }
                    } catch (e) {
                        serverInfo = `Error: ${e.message}`;
                    }

                    return {
                        connectionInfo,
                        serverInfo,
                        envVars: {
                            REDIS_HOST: process.env.REDIS_HOST,
                            REDIS_PORT: process.env.REDIS_PORT,
                            REDIS_DB: process.env.REDIS_DB,
                        },
                    };
                }
            }

            return { error: 'Redis client not found' };
        } catch (error) {
            return {
                error: error.message,
                stack: error.stack,
            };
        }
    }

    @Get('redis-direct')
    async redisDirect() {
        try {
            const store: any = (this.categoryCacheService as any).cacheManager.stores;

            if (Array.isArray(store) && store.length > 0) {
                const redisClient = store[0]?.opts?.store?.client;

                if (redisClient) {
                    const allKeys = await redisClient.keys('*');

                    let currentDB = 'unknown';
                    let dbInfo = 'N/A';

                    try {
                        if (typeof redisClient.sendCommand === 'function') {
                            const info = await redisClient.sendCommand(['INFO', 'keyspace']);
                            dbInfo = info;
                        } else if (typeof redisClient.info === 'function') {
                            dbInfo = await redisClient.info('keyspace');
                        } else if (typeof redisClient.configGet === 'function') {
                            const db = await redisClient.configGet('databases');
                            dbInfo = JSON.stringify(db);
                        }
                    } catch (infoError) {
                        dbInfo = `Error: ${infoError.message}`;
                    }

                    const samples = [{}];
                    for (const key of allKeys.slice(0, 5)) {
                        try {
                            const value = await redisClient.get(key);
                            const ttl = await redisClient.ttl(key);
                            samples.push({
                                key,
                                ttl,
                                valueLength: value ? value.length : 0,
                                valuePreview: value ? value.substring(0, 100) : null,
                            });
                        } catch (e) {
                            samples.push({
                                key,
                                error: e.message,
                            });
                        }
                    }

                    return {
                        totalKeys: allKeys.length,
                        allKeys: allKeys,
                        dbInfo: dbInfo,
                        samples: samples,
                        clientType: redisClient.constructor.name,
                        availableMethods: Object.keys(Object.getPrototypeOf(redisClient))
                            .filter(m => !m.startsWith('_'))
                            .slice(0, 30),
                        hint: 'در memurai-cli بزن: INFO keyspace و SELECT 0 تا SELECT 15',
                    };
                }
            }

            return { error: 'Redis client not found' };
        } catch (error) {
            return {
                error: error.message,
                stack: error.stack,
            };
        }
    }
}