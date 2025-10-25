import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CatalogCacheService {
    constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) { }

    async get<T>(key: string): Promise<T | null> {
        try {
            return (await this.cache.get<T>(key)) || null;
        } catch (err) {
            console.warn('Cache read error:', err.message);
            return null;
        }
    }

    async set<T>(key: string, value: T, ttl = 300): Promise<void> {
        try {
            await this.cache.set(key, value, ttl);
        } catch (err) {
            console.warn('Cache write error:', err.message);
        }
    }

    async clear(): Promise<void> {
        try {
            await this.cache.clear();
        } catch (err) {
            console.error('Cache clear error:', err.message);
        }
    }
}
