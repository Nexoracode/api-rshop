import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CatalogSearchSuggestion, CatalogSearchResult } from '../interfaces/catalog-search.interface';

@Injectable()
export class CatalogSearchService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  // 🔹 پیشنهادات سریع برای autocomplete
  async getSuggestions(term: string): Promise<CatalogSearchSuggestion> {
    if (!term || term.trim().length < 2) return { term, suggestions: [] };

    const key = `search:suggest:${term.toLowerCase()}`;
    const cached = await this.cacheManager.get<CatalogSearchSuggestion>(key);
    if (cached) return cached;

    const suggestions = await this.dataSource.query(
      `
      SELECT DISTINCT p.name
      FROM products p
      WHERE p.is_active = 1
        AND p.is_visible = 1
        AND p.name LIKE ?
      ORDER BY p.name ASC
      LIMIT 8
      `,
      [`%${term}%`],
    );

    const result: CatalogSearchSuggestion = {
      term,
      suggestions: suggestions.map((s) => s.name),
    };

    await this.cacheManager.set(key, result, 120);
    return result;
  }

  // 🔹 جستجوی کامل (با brand، category و attributes)
  async search(term: string, limit = 20): Promise<CatalogSearchResult> {
    if (!term || term.trim().length < 2) {
      return { term, products: [], categories: [], brands: [] };
    }

    const key = `search:full:${term.toLowerCase()}:${limit}`;
    const cached = await this.cacheManager.get<CatalogSearchResult>(key);
    if (cached) return cached;

    const likeTerm = `%${term}%`;

    // 🧠 محصولات
    const products = await this.dataSource.query(
      `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.discount_percent,
        p.discount_amount,
        COALESCE(
          CASE
            WHEN p.discount_percent > 0 THEN (p.price * p.discount_percent / 100)
            WHEN p.discount_amount > 0 THEN p.discount_amount
            ELSE 0
          END,
        0) AS discountValue,
        (
          p.price - COALESCE(
            CASE
              WHEN p.discount_percent > 0 THEN (p.price * p.discount_percent / 100)
              WHEN p.discount_amount > 0 THEN p.discount_amount
              ELSE 0
            END,
          0)
        ) AS finalPrice,
        b.id as brand_id,
        b.name as brand_name,
        b.slug as brand_slug,
        c.id as category_id,
        c.title as category_title,
        c.slug as category_slug,
        m.url as image
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN medias m ON m.id = p.media_pinned_id
      WHERE p.is_active = 1
        AND p.is_visible = 1
        AND (
          p.name LIKE ? OR
          p.description LIKE ? OR
          b.name LIKE ? OR
          c.title LIKE ?
        )
      ORDER BY p.id DESC
      LIMIT ?
      `,
      [likeTerm, likeTerm, likeTerm, likeTerm, limit],
    );

    // 🧩 برندها
    const brands = await this.dataSource.query(
      `
      SELECT DISTINCT b.id, b.name , b.slug
      FROM brands b
      INNER JOIN products p ON p.brand_id = b.id
      WHERE p.is_active = 1
        AND p.is_visible = 1
        AND b.is_active = 1
        AND (b.name LIKE ? OR p.name LIKE ?)
      LIMIT 10
      `,
      [likeTerm, likeTerm],
    );

    // 🧩 دسته‌ها
    const categories = await this.dataSource.query(
      `
      SELECT DISTINCT c.id, c.title , c.slug
      FROM categories c
      INNER JOIN products p ON p.category_id = c.id
      WHERE p.is_active = 1
        AND p.is_visible = 1
        AND c.is_active = 1
        AND (c.title LIKE ? OR p.name LIKE ?)
      LIMIT 10
      `,
      [likeTerm, likeTerm],
    );

    const result: CatalogSearchResult = {
      term,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        discountAmount: Number(p.discount_amount),
        discountPercent: Number(p.discount_percent),
        finalPrice: Number(p.finalPrice),
        brand: p.brand_id ? { id: p.brand_id, name: p.brand_name, slug: p.brand_slug } : undefined,
        category: p.category_id ? { id: p.category_id, title: p.category_title, slug: p.category_slug } : undefined,
        image: p.image || null,
      })),
      brands: brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug })),
      categories: categories.map((c) => ({ id: c.id, title: c.title, slug: c.slug })),
    };

    await this.cacheManager.set(key, result, 300);
    return result;
  }
}
