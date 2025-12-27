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

    @Get('redis-test-direct')
    async redisTestDirect() {
        try {
            const store: any = (this.categoryCacheService as any).cacheManager.stores;

            if (Array.isArray(store) && store.length > 0) {
                const redisClient = store[0]?.opts?.store?.client;

                if (redisClient) {
                    const testKey = 'SIMPLE_TEST_KEY';
                    const testValue = 'SIMPLE_VALUE_123';

                    // SET کن
                    await redisClient.set(testKey, testValue);
                    console.log('✅ SET done:', testKey);

                    // GET کن
                    const result = await redisClient.get(testKey);
                    console.log('✅ GET result:', result);

                    // لیست کن
                    const allKeys = await redisClient.keys('*');
                    console.log('✅ All keys:', allKeys);

                    return {
                        setKey: testKey,
                        setValue: testValue,
                        getResult: result,
                        allKeys: allKeys,
                        message: 'حالا برو memurai-cli و بزن: GET "SIMPLE_TEST_KEY"',
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

    @Get('redis-connection-info')
    async redisConnectionInfo() {
        try {
            const store: any = (this.categoryCacheService as any).cacheManager.stores;

            if (Array.isArray(store) && store.length > 0) {
                const redisClient = store[0]?.opts?.store?.client;

                if (redisClient) {
                    // دریافت اطلاعات اتصال
                    const connectionInfo = {
                        host: redisClient.options?.host || 'unknown',
                        port: redisClient.options?.port || 'unknown',
                        db: redisClient.options?.db || 'unknown',
                        password: redisClient.options?.password ? '***' : 'none',
                    };

                    // اطلاعات از INFO
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

    // health.controller.ts
    @Get('redis-direct')
    async redisDirect() {
        try {
            const store: any = (this.categoryCacheService as any).cacheManager.stores;

            if (Array.isArray(store) && store.length > 0) {
                const redisClient = store[0]?.opts?.store?.client;

                if (redisClient) {
                    // مستقیم از Redis بخون
                    const allKeys = await redisClient.keys('*');

                    // ببین روی کدوم DB هستیم - به روش درست
                    let currentDB = 'unknown';
                    let dbInfo = 'N/A';

                    try {
                        // روش 1: از طریق sendCommand
                        if (typeof redisClient.sendCommand === 'function') {
                            const info = await redisClient.sendCommand(['INFO', 'keyspace']);
                            dbInfo = info;
                        }
                        // روش 2: از طریق call مستقیم
                        else if (typeof redisClient.info === 'function') {
                            dbInfo = await redisClient.info('keyspace');
                        }
                        // روش 3: CONFIG GET
                        else if (typeof redisClient.configGet === 'function') {
                            const db = await redisClient.configGet('databases');
                            dbInfo = JSON.stringify(db);
                        }
                    } catch (infoError) {
                        dbInfo = `Error: ${infoError.message}`;
                    }

                    // چند تا sample key بخون
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
                        availableMethods: Object.keys(Object.getPrototypeOf(redisClient)).filter(m => !m.startsWith('_')).slice(0, 30),
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

    @Get('redis-keys')
    async redisKeys() {
        try {
            const store: any = (this.categoryCacheService as any).cacheManager.stores;

            console.log('🔍 Inspecting cache store...');

            if (Array.isArray(store) && store.length > 0) {
                const firstStore = store[0];
                console.log('Store type:', typeof firstStore);
                console.log('Store properties:', Object.keys(firstStore).slice(0, 30));

                // امتحان مسیرهای مختلف
                const paths = [
                    'opts.store',
                    'opts.store.redis',
                    'opts.store.client',
                    '_store',
                    '_store.redis',
                    'store',
                    'store.redis',
                ];

                for (const path of paths) {
                    try {
                        const parts = path.split('.');
                        let obj = firstStore;

                        for (const part of parts) {
                            obj = obj?.[part];
                        }

                        if (obj && typeof obj.keys === 'function') {
                            console.log(`✅ Found Redis at: ${path}`);
                            const keys = await obj.keys('*');

                            return {
                                found: true,
                                path: path,
                                totalKeys: keys.length,
                                keys: keys.slice(0, 20),
                            };
                        }
                    } catch (e) {
                        // ادامه بده
                    }
                }

                return {
                    found: false,
                    message: 'Could not find Redis client',
                    storeProperties: Object.keys(firstStore).slice(0, 30),
                };
            }

            return {
                found: false,
                message: 'No stores found',
            };
        } catch (error) {
            return {
                error: error.message,
                stack: error.stack,
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