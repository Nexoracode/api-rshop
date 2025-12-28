// src/common/helpers/redis.helper.ts
import { Logger } from '@nestjs/common';

export class RedisHelper {
    private static readonly logger = new Logger('RedisHelper');

    /**
     * دریافت Redis Client - با همون منطق سرویس‌های cache
     */
    static getRedisClient(cacheManager: any): any {
        const stores: any = cacheManager.stores;

        // حالت 1: stores یک آرایه است
        if (Array.isArray(stores) && stores.length > 0) {
            const store = stores[0];

            // مسیر اصلی - از redis-direct مشخص شد که اینجاست
            if (store?.opts?.store?.client) {
                this.logger.debug('✅ Redis client found at: store.opts.store.client');
                return store.opts.store.client;
            }

            // سایر مسیرها
            if (store?.opts?.store?.redis) {
                this.logger.debug('✅ Redis client found at: store.opts.store.redis');
                return store.opts.store.redis;
            }

            if (store?.redis) {
                this.logger.debug('✅ Redis client found at: store.redis');
                return store.redis;
            }

            if (store?._store?.redis) {
                this.logger.debug('✅ Redis client found at: store._store.redis');
                return store._store.redis;
            }

            if (store?.client) {
                this.logger.debug('✅ Redis client found at: store.client');
                return store.client;
            }
        }

        // حالت 2: stores یک شیء است
        if (stores && typeof stores === 'object' && !Array.isArray(stores)) {
            if (stores?.opts?.store?.client) {
                this.logger.debug('✅ Redis client found at: stores.opts.store.client');
                return stores.opts.store.client;
            }

            if (stores?.opts?.store?.redis) {
                this.logger.debug('✅ Redis client found at: stores.opts.store.redis');
                return stores.opts.store.redis;
            }

            if (stores?.redis) {
                this.logger.debug('✅ Redis client found at: stores.redis');
                return stores.redis;
            }

            if (stores?.client) {
                this.logger.debug('✅ Redis client found at: stores.client');
                return stores.client;
            }
        }

        this.logger.warn('⚠️ Redis client not found in any known path');
        return null;
    }

    /**
     * دریافت تمام کلیدها با pattern
     * ⚠️ به خاطر namespace دوبل، باید * استفاده کنیم
     */
    static async getKeysByPattern(
        cacheManager: any,
        pattern: string
    ): Promise<string[]> {
        const redisClient = this.getRedisClient(cacheManager);

        if (!redisClient || typeof redisClient.keys !== 'function') {
            this.logger.warn('⚠️ Redis client not available for pattern search');
            return [];
        }

        try {
            // ✅ چون namespace دوتا اضافه شده، باید همه رو بگیریم و فیلتر کنیم
            const allKeys = await redisClient.keys('*');

            if (!allKeys || allKeys.length === 0) {
                return [];
            }

            // فیلتر کلیدها بر اساس pattern
            // pattern مثلاً: category:* یا product:detail:*
            const filteredKeys = allKeys.filter((key: string) => {
                // حذف namespace های اضافی
                const cleanKey = key.replace(/^rshop::/g, '').replace(/^rshop:/g, '');

                // تبدیل pattern به regex
                const regexPattern = pattern
                    .replace(/\*/g, '.*')
                    .replace(/\?/g, '.');

                const regex = new RegExp(`^${regexPattern}$`);
                return regex.test(cleanKey);
            });

            this.logger.debug(`Found ${filteredKeys.length}/${allKeys.length} keys matching pattern: ${pattern}`);

            return filteredKeys;
        } catch (error) {
            this.logger.error(`❌ Error getting keys with pattern "${pattern}":`, error.message);
            return [];
        }
    }

    /**
     * حذف کلیدها با pattern
     */
    static async deleteKeysByPattern(
        cacheManager: any,
        pattern: string
    ): Promise<number> {
        const redisClient = this.getRedisClient(cacheManager);

        if (!redisClient) {
            this.logger.warn('⚠️ Redis client not available for deletion');
            return 0;
        }

        try {
            const keys = await this.getKeysByPattern(cacheManager, pattern);

            if (!keys || keys.length === 0) {
                this.logger.debug(`No keys found with pattern: ${pattern}`);
                return 0;
            }

            // استفاده از Pipeline برای حذف سریع
            if (typeof redisClient.pipeline === 'function') {
                const pipeline = redisClient.pipeline();
                keys.forEach((key: string) => pipeline.del(key));
                await pipeline.exec();
            } else {
                // اگر pipeline نداره، یکی یکی حذف کن
                await Promise.all(
                    keys.map((key: string) => redisClient.del(key))
                );
            }

            this.logger.log(`✅ Deleted ${keys.length} keys with pattern "${pattern}"`);
            return keys.length;
        } catch (error) {
            this.logger.error(`❌ Error deleting keys with pattern "${pattern}":`, error.message);
            return 0;
        }
    }

    /**
     * گرفتن آمار با pattern
     */
    static async getStatsByPattern(
        cacheManager: any,
        pattern: string
    ): Promise<number> {
        const keys = await this.getKeysByPattern(cacheManager, pattern);
        return keys.length;
    }

    /**
     * دریافت تمام کلیدها در Redis
     */
    static async getAllKeys(cacheManager: any): Promise<string[]> {
        const redisClient = this.getRedisClient(cacheManager);

        if (!redisClient || typeof redisClient.keys !== 'function') {
            return [];
        }

        try {
            const keys = await redisClient.keys('*');
            return keys || [];
        } catch (error) {
            this.logger.error('❌ Error getting all keys:', error.message);
            return [];
        }
    }

    /**
     * دریافت اطلاعات کلید
     */
    static async getKeyInfo(
        cacheManager: any,
        key: string
    ): Promise<{
        exists: boolean;
        value?: any;
        ttl?: number;
        type?: string;
    }> {
        const redisClient = this.getRedisClient(cacheManager);

        if (!redisClient) {
            return { exists: false };
        }

        try {
            // جستجوی کلید با pattern (چون namespace دوتا هست)
            const allKeys = await redisClient.keys('*');
            const matchingKey = allKeys.find((k: string) => {
                const cleanKey = k.replace(/^rshop::/g, '').replace(/^rshop:/g, '');
                return cleanKey === key || k === key;
            });

            if (!matchingKey) {
                return { exists: false };
            }

            const value = await redisClient.get(matchingKey);

            if (!value) {
                return { exists: false };
            }

            const ttl = typeof redisClient.ttl === 'function'
                ? await redisClient.ttl(matchingKey)
                : null;

            const type = typeof redisClient.type === 'function'
                ? await redisClient.type(matchingKey)
                : 'string';

            // تلاش برای parse کردن JSON
            let parsedValue = value;
            try {
                parsedValue = JSON.parse(value);
            } catch (e) {
                // not JSON, keep as is
            }

            return {
                exists: true,
                value: parsedValue,
                ttl: ttl > 0 ? ttl : null,
                type,
            };
        } catch (error) {
            this.logger.error(`❌ Error getting key info for "${key}":`, error.message);
            return { exists: false };
        }
    }

    /**
     * تست اتصال Redis
     */
    static async testConnection(cacheManager: any): Promise<{
        isConnected: boolean;
        canRead: boolean;
        canWrite: boolean;
        message: string;
    }> {
        const redisClient = this.getRedisClient(cacheManager);

        if (!redisClient) {
            return {
                isConnected: false,
                canRead: false,
                canWrite: false,
                message: '❌ Redis client not found',
            };
        }

        try {
            const testKey = 'test:connection:helper';
            const testValue = `test-${Date.now()}`;

            // تست نوشتن
            await redisClient.set(testKey, testValue);

            // تست خواندن
            const allKeys = await redisClient.keys('*');
            const writtenKey = allKeys.find((k: string) => k.includes('test:connection:helper'));

            if (!writtenKey) {
                throw new Error('Test key not found after write');
            }

            const retrievedValue = await redisClient.get(writtenKey);

            // پاک کردن
            await redisClient.del(writtenKey);

            const isWorking = retrievedValue === testValue;

            return {
                isConnected: true,
                canRead: isWorking,
                canWrite: isWorking,
                message: isWorking
                    ? '✅ Redis connection is healthy'
                    : '⚠️ Redis connection has issues',
            };
        } catch (error) {
            this.logger.error('❌ Redis connection test failed:', error.message);
            return {
                isConnected: false,
                canRead: false,
                canWrite: false,
                message: `❌ Error: ${error.message}`,
            };
        }
    }

    /**
     * پاک کردن کلیدهای با namespace دوبل
     */
    static cleanKey(key: string): string {
        return key.replace(/^rshop::/g, '').replace(/^rshop:/g, '');
    }
}