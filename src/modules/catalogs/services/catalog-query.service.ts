import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Category } from '../../category/entities/category.entity';

@Injectable()
export class CatalogQueryService {
  constructor(private readonly dataSource: DataSource) { }

  // 🎯 ساخت فیلترها برای صفحه دسته
  async buildFilters(category: Category, categoryIds: number[]) {
    // برندها
    const brands = await this.dataSource.query(
      `
      SELECT b.id, b.slug, b.name, COUNT(p.id) as count
      FROM products p
      INNER JOIN brands b ON b.id = p.brand_id
      WHERE p.is_active = 1 AND b.is_active = 1
        AND p.category_id IN (${categoryIds.map(() => '?').join(',')})
      GROUP BY b.id, b.name
      `,
      categoryIds,
    );

    // ویژگی‌ها (attribute)
    const attributesRaw = await this.dataSource.query(
      `
      SELECT DISTINCT
        a.id AS attribute_id,
        a.name AS attribute_name,
        a.type AS attribute_type,
        av.value AS attribute_value
      FROM product_attribute_values pav
      INNER JOIN attributes a ON a.id = pav.attribute_id
      LEFT JOIN attribute_values av ON av.id = pav.value_id
      INNER JOIN products p ON p.id = pav.product_id
      WHERE p.is_active = 1
        AND p.category_id IN (${categoryIds.map(() => '?').join(',')})
        AND av.value IS NOT NULL
      `,
      categoryIds,
    );

    const attributeMap = new Map<
      number,
      { id: number; name: string; type: string; values: string[] }
    >();

    for (const row of attributesRaw) {
      if (!attributeMap.has(row.attribute_id)) {
        attributeMap.set(row.attribute_id, {
          id: row.attribute_id,
          name: row.attribute_name,
          type: row.attribute_type,
          values: [],
        });
      }
      const attr = attributeMap.get(row.attribute_id)!;
      if (row.attribute_value && !attr.values.includes(row.attribute_value)) {
        attr.values.push(row.attribute_value);
      }
    }

    // بازه قیمت
    const priceRange = await this.dataSource.query(
      `
      SELECT 
        MIN(p.price - COALESCE(p.discount_amount, 0)) as min,
        MAX(p.price - COALESCE(p.discount_amount, 0)) as max
      FROM products p
      WHERE p.is_active = 1
        AND p.category_id IN (${categoryIds.map(() => '?').join(',')})
      `,
      categoryIds,
    );

    // زیردسته‌ها
    const subCategories = (category.children || []).map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      count: 0,
    }));

    return {
      attributes: Array.from(attributeMap.values()),
      generic: {
        special_offer: {
          type: 'boolean',
          label: 'فقط محصولات دارای تخفیف',
        },
        price_range: {
          min: Number(priceRange[0].min) || 0,
          max: Number(priceRange[0].max) || 0,
        },
        categories: subCategories,
        brands: brands.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          count: Number(b.count),
        })),
      },
    };
  }
}
