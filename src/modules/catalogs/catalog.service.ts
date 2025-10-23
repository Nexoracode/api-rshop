import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, TreeRepository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Product } from '../product/entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { Brand } from '../brand/entities/brand.entity';

@Injectable()
export class CatalogService {
    private treeCatRepo: TreeRepository<Category>;

    // 📊 Metrics (optional)
    private metrics = {
        searchTotal: 0,
        cacheHits: 0,
        cacheMisses: 0,
    };

    constructor(
        @InjectRepository(Brand)
        private readonly brandRepo: Repository<Brand>,
        private readonly dataSource: DataSource,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.treeCatRepo = this.dataSource.getTreeRepository(Category);
    }

    /**
     * 🔍 سرچ هوشمند با Cache
     */
    async smartSearch(searchTerm: string, limit: number = 50): Promise<any> {
        this.metrics.searchTotal++;

        // Validation
        if (!searchTerm || searchTerm.trim().length < 2) {
            return {
                products: [],
                groupedByCategory: [],
                groupedByBrand: [],
                totalCount: 0,
            };
        }

        // 🔑 Cache key
        const normalized = searchTerm.toLowerCase().trim();
        const cacheKey = `smart-search:${normalized}:${limit}`;

        try {
            // ✅ چک کردن cache
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                this.metrics.cacheHits++;
                console.log(`✅ Cache HIT: ${cacheKey} (${this.getCacheHitRate()})`);
                return cached;
            }
        } catch (error) {
            console.error('⚠️ Cache read error:', error.message);
        }

        this.metrics.cacheMisses++;
        console.log(`❌ Cache MISS: ${cacheKey} (${this.getCacheHitRate()})`);

        // 🔍 Database query
        const term = searchTerm.trim();

        try {
            // استفاده از FULLTEXT اگه Index داری، وگرنه LIKE
            const productsRaw = await this.dataSource.query(`
                SELECT 
                    p.id,
                    p.name,
                    p.price,
                    COALESCE(p.discount_amount, 0) as discountAmount,
                    (p.price - COALESCE(p.discount_amount, 0)) as finalPrice,
                    
                    c.id as category_id,
                    c.title as category_title,
                    c.slug as category_slug,
                    
                    b.id as brand_id,
                    b.name as brand_name,
                    b.slug as brand_slug,
                    b.logo as brand_logo,
                    
                    m.url as image
                    
                FROM products p
                INNER JOIN categories c ON c.id = p.category_id
                LEFT JOIN brands b ON b.id = p.brand_id
                LEFT JOIN media m ON m.id = p.media_pinned_id
                
                WHERE p.is_active = 1
                    AND c.is_active = 1
                    AND (p.name LIKE ? OR p.description LIKE ?)
                
                ORDER BY p.id DESC
                LIMIT ?
            `, [`%${term}%`, `%${term}%`, limit]);

            // پردازش نتایج
            const result = this.processSearchResults(productsRaw);

            // 💾 ذخیره در cache (5 دقیقه)
            try {
                await this.cacheManager.set(cacheKey, result, 300);
            } catch (error) {
                console.error('⚠️ Cache write error:', error.message);
            }

            return result;

        } catch (error) {
            console.error('❌ Search query error:', error);
            throw error;
        }
    }

    /**
     * 📊 آمار سرچ با Cache
     */
    async getSearchStats(searchTerm: string): Promise<any> {
        if (!searchTerm || searchTerm.trim().length < 2) {
            return {
                totalProducts: 0,
                categories: [],
                brands: [],
            };
        }

        const normalized = searchTerm.toLowerCase().trim();
        const cacheKey = `search-stats:${normalized}`;

        try {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                console.log('✅ Stats Cache HIT');
                return cached;
            }
        } catch (error) {
            console.error('⚠️ Cache error:', error.message);
        }

        const term = `%${searchTerm.trim()}%`;

        // آمار دسته‌بندی‌ها
        const categoryStats = await this.dataSource.query(`
            SELECT 
                c.id,
                c.title,
                c.slug,
                COUNT(p.id) as productCount
            FROM products p
            INNER JOIN categories c ON c.id = p.category_id
            WHERE p.is_active = 1
                AND c.is_active = 1
                AND (p.name LIKE ? OR p.description LIKE ?)
            GROUP BY c.id, c.title, c.slug
            ORDER BY productCount DESC
            LIMIT 10
        `, [term, term]);

        // آمار برندها
        const brandStats = await this.dataSource.query(`
            SELECT 
                b.id,
                b.name,
                b.slug,
                b.logo,
                COUNT(p.id) as productCount
            FROM products p
            INNER JOIN brands b ON b.id = p.brand_id
            WHERE p.is_active = 1
                AND b.is_active = 1
                AND (p.name LIKE ? OR p.description LIKE ?)
            GROUP BY b.id, b.name, b.slug, b.logo
            ORDER BY productCount DESC
            LIMIT 10
        `, [term, term]);

        // تعداد کل
        const totalResult = await this.dataSource.query(`
            SELECT COUNT(*) as total
            FROM products p
            WHERE p.is_active = 1
                AND (p.name LIKE ? OR p.description LIKE ?)
        `, [term, term]);

        const result = {
            totalProducts: parseInt(totalResult[0].total),
            categories: categoryStats.map(c => ({
                id: c.id,
                title: c.title,
                slug: c.slug,
                productCount: parseInt(c.productCount),
            })),
            brands: brandStats.map(b => ({
                id: b.id,
                name: b.name,
                slug: b.slug,
                logo: b.logo,
                productCount: parseInt(b.productCount),
            })),
        };

        // Cache for 5 minutes
        try {
            await this.cacheManager.set(cacheKey, result, 300);
        } catch (error) {
            console.error('⚠️ Cache write error:', error.message);
        }

        return result;
    }

    /**
     * 🎯 سرچ در دسته (بدون cache چون زیاد استفاده نمی‌شه)
     */
    async searchInCategory(
        searchTerm: string,
        categorySlug: string,
        limit: number = 20
    ): Promise<any> {
        if (!searchTerm || searchTerm.trim().length < 2) {
            return { products: [], category: null, totalCount: 0 };
        }

        const category = await this.findBySlugWithDescendants(categorySlug);
        if (!category) throw new NotFoundException('دسته یافت نشد');

        const categoryIds = this.extractCategoryIds(category);
        const term = `%${searchTerm.trim()}%`;

        const productsRaw = await this.dataSource.query(`
            SELECT 
                p.id, p.name, p.slug, p.price,
                COALESCE(p.discount_amount, 0) as discountAmount,
                (p.price - COALESCE(p.discount_amount, 0)) as finalPrice,
                c.id as category_id, c.title as category_title, c.slug as category_slug,
                b.id as brand_id, b.name as brand_name, b.slug as brand_slug,
                m.url as image
            FROM products p
            INNER JOIN categories c ON c.id = p.category_id
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN media m ON m.id = p.media_pinned_id
            WHERE p.is_active = 1
                AND p.category_id IN (${categoryIds.join(',')})
                AND (p.name LIKE ? OR p.description LIKE ?)
            ORDER BY p.id DESC
            LIMIT ?
        `, [term, term, limit]);

        const products = productsRaw.map(p => this.formatProduct(p));

        return {
            products,
            category: { id: category.id, title: category.title, slug: category.slug },
            totalCount: products.length,
        };
    }

    /**
     * 🎯 سرچ در برند (بدون cache)
     */
    async searchInBrand(
        searchTerm: string,
        brandSlug: string,
        limit: number = 20
    ): Promise<any> {
        if (!searchTerm || searchTerm.trim().length < 2) {
            return { products: [], brand: null, totalCount: 0 };
        }

        const brand = await this.brandRepo.findOne({ where: { slug: brandSlug } });
        if (!brand) throw new NotFoundException('برند یافت نشد');

        const term = `%${searchTerm.trim()}%`;

        const productsRaw = await this.dataSource.query(`
            SELECT 
                p.id, p.name, p.slug, p.price,
                COALESCE(p.discount_amount, 0) as discountAmount,
                (p.price - COALESCE(p.discount_amount, 0)) as finalPrice,
                c.id as category_id, c.title as category_title, c.slug as category_slug,
                m.url as image
            FROM products p
            INNER JOIN categories c ON c.id = p.category_id
            LEFT JOIN media m ON m.id = p.media_pinned_id
            WHERE p.is_active = 1
                AND p.brand_id = ?
                AND (p.name LIKE ? OR p.description LIKE ?)
            ORDER BY p.id DESC
            LIMIT ?
        `, [brand.id, term, term, limit]);

        const products = productsRaw.map(p => this.formatProduct(p));

        return {
            products,
            brand: { id: brand.id, name: brand.name, slug: brand.slug, logo: brand.logo },
            totalCount: products.length,
        };
    }

    /**
     * 🔄 پردازش نتایج سرچ
     */
    private processSearchResults(productsRaw: any[]) {
        const products = productsRaw.map(p => this.formatProduct(p));

        // گروه‌بندی
        const categoryGroups = new Map();
        const brandGroups = new Map();

        products.forEach(product => {
            // Category
            const catId = product.category.id;
            if (!categoryGroups.has(catId)) {
                categoryGroups.set(catId, {
                    category: product.category,
                    count: 0,
                    products: [],
                });
            }
            categoryGroups.get(catId).count++;
            categoryGroups.get(catId).products.push(product);

            // Brand
            if (product.brand) {
                const brandId = product.brand.id;
                if (!brandGroups.has(brandId)) {
                    brandGroups.set(brandId, {
                        brand: product.brand,
                        count: 0,
                        products: [],
                    });
                }
                brandGroups.get(brandId).count++;
                brandGroups.get(brandId).products.push(product);
            }
        });

        return {
            products,
            groupedByCategory: Array.from(categoryGroups.values()).sort((a, b) => b.count - a.count),
            groupedByBrand: Array.from(brandGroups.values()).sort((a, b) => b.count - a.count),
            totalCount: products.length,
        };
    }

    /**
     * فرمت کردن محصول
     */
    private formatProduct(p: any) {
        return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: parseFloat(p.price),
            discountAmount: parseFloat(p.discountAmount) || 0,
            finalPrice: parseFloat(p.finalPrice),
            image: p.image,
            category: {
                id: p.category_id,
                title: p.category_title,
                slug: p.category_slug,
            },
            brand: p.brand_id ? {
                id: p.brand_id,
                name: p.brand_name,
                slug: p.brand_slug,
                logo: p.brand_logo,
            } : null,
        };
    }

    /**
     * 📊 دریافت metrics
     */
    getMetrics() {
        const hitRate = this.metrics.searchTotal > 0
            ? (this.metrics.cacheHits / this.metrics.searchTotal * 100).toFixed(2)
            : '0.00';

        return {
            total: this.metrics.searchTotal,
            cacheHits: this.metrics.cacheHits,
            cacheMisses: this.metrics.cacheMisses,
            hitRate: `${hitRate}%`,
        };
    }

    /**
     * محاسبه cache hit rate
     */
    private getCacheHitRate(): string {
        if (this.metrics.searchTotal === 0) return '0%';
        const rate = (this.metrics.cacheHits / this.metrics.searchTotal * 100).toFixed(1);
        return `${rate}% hit rate`;
    }

    /**
     * 🗑️ پاک کردن cache (برای admin)
     */
    async clearSearchCache() {
        try {
            await this.cacheManager.clear();
            console.log('✅ Cache cleared');
            return { success: true, message: 'Cache cleared successfully' };
        } catch (error) {
            console.error('❌ Cache clear error:', error);
            throw error;
        }
    }

    // ... (متدهای قبلی: findBySlugWithDescendants, extractCategoryIds, etc.)

    private async findBySlugWithDescendants(slug: string): Promise<Category> {
        const node = await this.treeCatRepo.findOne({
            where: { slug },
            relations: ['parent', 'children.parent'],
        });
        if (!node) throw new NotFoundException('دسته یافت نشد');
        return this.treeCatRepo.findDescendantsTree(node);
    }

    private extractCategoryIds(category: Category): number[] {
        const ids = [category.id];
        if (category.children?.length)
            for (const child of category.children)
                ids.push(...this.extractCategoryIds(child));
        return ids;
    }
}