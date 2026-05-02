import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { Product } from 'src/modules/product/entities/product.entity';


// نوع جدید برای مقدارهای هر attribute
interface AttributeValue {
  id: number;
  value: string;
  displayColor: string;
}

// نوع برای attribute اصلی
interface AttributeItem {
  id: number;
  name: string;
  type: string;
  values: AttributeValue[];
}

type BuildQBInput = {
  categoryIds: number[];
  attributeMap: Record<number, number[]>; // { attrId: [valueId,...], ... }
  sortBy?: [string, 'ASC' | 'DESC'][];
};

@Injectable()
export class CatalogQueryService {
  constructor(private readonly dataSource: DataSource) { }

  async buildProductsQBByCategory(input: BuildQBInput) {
    const { categoryIds, attributeMap, sortBy } = input;

    const qb = this.dataSource.getRepository(Product)
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.mediaPinned', 'mediaPinned')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.category', 'category')
      // برای محاسبه فیلترها و vitals
      .leftJoin('p.variants', 'v')
      .leftJoin('v.attributes', 'va')       // جدول واسط variant_attributes
      .leftJoin('va.attribute', 'attr')
      .leftJoin('va.value', 'aval')
      .where('p.isActive = true')
      .andWhere('p.categoryId IN (:...categoryIds)', { categoryIds });

    // ----- فیلتر attributes -----
    const attrIds = Object.keys(attributeMap).map((k) => +k).filter(Boolean);
    if (attrIds.length > 0) {
      // شرط: وجود حداقل یک واریانت که تمام attributeهای انتخابی را با یکی از valueهای مجاز داشته باشد
      // EXISTS (
      //    SELECT v2.id
      //    FROM product_variants v2
      //    JOIN variant_attributes va2 ON va2.variant_id = v2.id
      //    WHERE v2.product_id = p.id
      //      AND (
      //         (va2.attribute_id = :a1 AND va2.value_id IN (:...a1_vals)) OR
      //         (va2.attribute_id = :a2 AND va2.value_id IN (:...a2_vals)) OR ...
      //      )
      //    GROUP BY v2.id
      //    HAVING COUNT(DISTINCT va2.attribute_id) = :numAttrs
      // )

      const orParts: string[] = [];
      const params: any = { numAttrs: attrIds.length };

      attrIds.forEach((attrId, idx) => {
        const paramAttr = `a${idx}`;
        const paramVals = `a${idx}_vals`;
        orParts.push(`(va2.attribute_id = :${paramAttr} AND va2.value_id IN (:...${paramVals}))`);
        params[paramAttr] = attrId;
        params[paramVals] = attributeMap[attrId];
      });

      const existsSql = `
        EXISTS (
          SELECT 1
          FROM variants_product v2
          JOIN variant_attribute_values va2 ON va2.variant_id = v2.id
          WHERE v2.product_id = p.id
            AND (
              ${orParts.join(' OR ')}
            )
          GROUP BY v2.id
          HAVING COUNT(DISTINCT va2.attribute_id) = :numAttrs
        )
      `;

      qb.andWhere(existsSql, params);
    }

    // ----- مرتب‌سازی سفارشی (اختیاری) -----
    if (Array.isArray(sortBy)) {
      for (const [col, dir] of sortBy) {
        // white-list ساده:
        if (['id', 'createdAt', 'price'].includes(col)) {
          qb.addOrderBy(`p.${col}`, dir === 'ASC' ? 'ASC' : 'DESC');
        }
      }
    } else {
      qb.addOrderBy('p.id', 'DESC');
    }

    return qb;
  }

  // 🎯 ساخت فیلترها برای صفحه دسته
  async buildFilters(category: Category, categoryIds: number[]) {
    // ------------------------------------------
    // ۱. برندها
    // ------------------------------------------
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

    // ------------------------------------------
    // ۲. ویژگی‌ها از category_attribute + product_attribute_values
    // ------------------------------------------
    const productAttrs = await this.dataSource.query(
      `
      SELECT DISTINCT
        a.id AS attribute_id,
        a.name AS attribute_name,
        a.type AS attribute_type,
        av.id AS attribute_value_id,
        av.value AS attribute_value,
        av.display_color AS attribute_value_color
      FROM category_attributes ca
      INNER JOIN attributes a ON a.id = ca.attribute_id
      INNER JOIN attribute_values av ON av.attribute_id = a.id
      INNER JOIN product_attribute_values pav ON pav.value_id = av.id
      INNER JOIN products p ON p.id = pav.product_id
      WHERE p.is_active = 1
        AND p.category_id IN (${categoryIds.map(() => '?').join(',')})
        AND ca.category_id IN (${categoryIds.map(() => '?').join(',')})
        AND av.value IS NOT NULL
    `,
      [...categoryIds, ...categoryIds],
    );

    // ------------------------------------------
    // ۳. ویژگی‌های واریانت از category_attribute + variant_attribute_values
    // ------------------------------------------
    const variantAttrs = await this.dataSource.query(
      `
      SELECT DISTINCT
        a.id AS attribute_id,
        a.name AS attribute_name,
        a.type AS attribute_type,
        av.id AS attribute_value_id,
        av.value AS attribute_value,
        av.display_color AS attribute_value_color
      FROM category_attributes ca
      INNER JOIN attributes a ON a.id = ca.attribute_id
      INNER JOIN attribute_values av ON av.attribute_id = a.id
      INNER JOIN variant_attribute_values vav ON vav.value_id = av.id
      INNER JOIN variants_product v ON v.id = vav.variant_id
      INNER JOIN products p ON p.id = v.product_id
      WHERE p.is_active = 1
        AND p.category_id IN (${categoryIds.map(() => '?').join(',')})
        AND ca.category_id IN (${categoryIds.map(() => '?').join(',')})
        AND av.value IS NOT NULL
    `,
      [...categoryIds, ...categoryIds],
    );

    // ------------------------------------------
    // ۴. ترکیب نتایج product + variant و حذف تکراری‌ها
    // ------------------------------------------
    const attributesRaw = [...productAttrs, ...variantAttrs];
    const attributeMap = new Map<
      number,
      { id: number; name: string; type: string; values: AttributeValue[] }
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
      if (
        row.attribute_value &&
        row.attribute_value_id &&
        !attr.values.some((v) => v.id === row.attribute_value_id)
      ) {
        attr.values.push({
          id: row.attribute_value_id,
          value: row.attribute_value,
          displayColor: row.attribute_value_color ?? null,
        });
      }
    }

    // ------------------------------------------
    // ۵. بازه قیمت
    // ------------------------------------------
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

    // ------------------------------------------
    // ۴. ساخت breadcrumb و درخت کتگوری
    // ------------------------------------------
    const categoryRepo = this.dataSource.getTreeRepository(Category);

    // مسیر از ریشه تا دسته فعلی
    const ancestors = await categoryRepo.findAncestors(category);

    // آخرین جد (ریشه‌ی همین شاخه)
    const root = ancestors[0];

    // ساخت درخت فقط از همین شاخه
    const rootTree = await categoryRepo.findDescendantsTree(root);

    // Breadcrumb از والد اول تا همین دسته فعلی
    const breadcrumbCategories = ancestors.map((c, index) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      level: index + 1,
    }));

    // تابع بازگشتی برای ساخت ساختار فیلتر درختی
    const buildTree = (cats: Category[]): any[] =>
      cats.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        children: c.children ? buildTree(c.children) : [],
      }));

    // درخت شاخه‌ی فعلی (از والد اصلی تا انتها)
    const treeCategories = buildTree([rootTree]);

    // ------------------------------------------
    // ۷. خروجی نهایی برای فرانت
    // ------------------------------------------
    return {
      attributes: Array.from(attributeMap.values()),
      generic: {
        boolean_filter: {
          special_offer: {
            type: 'boolean',
            label: 'فقط محصولات پیشنهاد ویژه',
          },
          discounted: {
            type: 'boolean',
            label: 'فقط محصولات دارای تخفیف'
          },
          same_day_shipping: {
            type: 'boolean',
            label: 'ارسال سریع',
          },
          in_stock: {
            type: 'boolean',
            label: 'فقط محصولات موجود در انبار',
          },
        },
        price_range: {
          min: Number(priceRange[0].min) || 0,
          max: Number(priceRange[0].max) || 0,
        },
        categories: treeCategories,
        brands: brands.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          count: Number(b.count),
        })),
      },
    };
  }

  // 🎯 ساخت فیلترها برای تمام محصولات (بدون دسته‌بندی)
  async buildFiltersForAllProducts() {
    // ------------------------------------------
    // ۱. برندها
    // ------------------------------------------
    const brands = await this.dataSource.query(
      `
    SELECT b.id, b.slug, b.name, COUNT(p.id) as count
    FROM products p
    INNER JOIN brands b ON b.id = p.brand_id
    WHERE p.is_active = 1 AND b.is_active = 1
    GROUP BY b.id, b.name
    `,
    );

    // // ------------------------------------------
    // // ۲. ویژگی‌ها از product_attribute_values
    // // ------------------------------------------
    // const productAttrs = await this.dataSource.query(
    //   `
    //   SELECT DISTINCT
    //     a.id AS attribute_id,
    //     a.name AS attribute_name,
    //     a.type AS attribute_type,
    //     av.id AS attribute_value_id,
    //     av.value AS attribute_value,
    //     av.display_color AS attribute_value_color
    //   FROM attributes a
    //   INNER JOIN attribute_values av ON av.attribute_id = a.id
    //   INNER JOIN product_attribute_values pav ON pav.value_id = av.id
    //   INNER JOIN products p ON p.id = pav.product_id
    //   WHERE p.is_active = 1
    //     AND av.value IS NOT NULL
    // `,
    // );

    // // ------------------------------------------
    // // ۳. ویژگی‌های واریانت از variant_attribute_values
    // // ------------------------------------------
    // const variantAttrs = await this.dataSource.query(
    //   `
    //   SELECT DISTINCT
    //     a.id AS attribute_id,
    //     a.name AS attribute_name,
    //     a.type AS attribute_type,
    //     av.id AS attribute_value_id,
    //     av.value AS attribute_value,
    //     av.display_color AS attribute_value_color
    //   FROM attributes a
    //   INNER JOIN attribute_values av ON av.attribute_id = a.id
    //   INNER JOIN variant_attribute_values vav ON vav.value_id = av.id
    //   INNER JOIN variants_product v ON v.id = vav.variant_id
    //   INNER JOIN products p ON p.id = v.product_id
    //   WHERE p.is_active = 1
    //     AND av.value IS NOT NULL
    // `,
    // );

    // ------------------------------------------
    // ۴. ترکیب نتایج product + variant و حذف تکراری‌ها
    // ------------------------------------------
    // const attributesRaw = [...productAttrs, ...variantAttrs];
    // const attributeMap = new Map<
    //   number,
    //   { id: number; name: string; type: string; values: AttributeValue[] }
    // >();

    // for (const row of attributesRaw) {
    //   if (!attributeMap.has(row.attribute_id)) {
    //     attributeMap.set(row.attribute_id, {
    //       id: row.attribute_id,
    //       name: row.attribute_name,
    //       type: row.attribute_type,
    //       values: [],
    //     });
    //   }

    //   const attr = attributeMap.get(row.attribute_id)!;
    //   if (
    //     row.attribute_value &&
    //     row.attribute_value_id &&
    //     !attr.values.some((v) => v.id === row.attribute_value_id)
    //   ) {
    //     attr.values.push({
    //       id: row.attribute_value_id,
    //       value: row.attribute_value,
    //       displayColor: row.attribute_value_color ?? null,
    //     });
    //   }
    // }

    // ------------------------------------------
    // ۵. بازه قیمت
    // ------------------------------------------
    const priceRange = await this.dataSource.query(
      `
    SELECT 
      MIN(p.price - COALESCE(p.discount_amount, 0)) as min,
      MAX(p.price - COALESCE(p.discount_amount, 0)) as max
    FROM products p
    WHERE p.is_active = 1
    `,
    );

    // ------------------------------------------
    // ۶. دسته‌بندی‌ها (تمام درخت)
    // ------------------------------------------
    const categoryRepo = this.dataSource.getTreeRepository(Category);
    const rootCategories = await categoryRepo.findRoots();

    // تابع بازگشتی برای ساخت درخت
    const buildTree = async (cats: Category[]): Promise<any[]> => {
      const result: { id: number; title: string; slug: string; children: any[] }[] = [];
      for (const cat of cats) {
        const descendants = await categoryRepo.findDescendantsTree(cat);
        result.push({
          id: descendants.id,
          title: descendants.title,
          slug: descendants.slug,
          children: descendants.children ? await buildTree(descendants.children) : [],
        });
      }
      return result;
    };

    const treeCategories = await buildTree(rootCategories);

    // ------------------------------------------
    // ۷. خروجی نهایی
    // ------------------------------------------
    return {
      attributes: [],
      generic: {
        boolean_filter: {
          special_offer: {
            type: 'boolean',
            label: 'فقط محصولات پیشنهاد ویژه',
          },
          discounted: {
            type: 'boolean',
            label: 'فقط محصولات دارای تخفیف'
          },
          same_day_shipping: {
            type: 'boolean',
            label: 'ارسال سریع',
          },
          in_stock: {
            type: 'boolean',
            label: 'فقط محصولات موجود در انبار',
          },
        },
        price_range: {
          min: Number(priceRange[0].min) || 0,
          max: Number(priceRange[0].max) || 0,
        },
        categories: treeCategories,
        brands: brands.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          count: Number(b.count),
        })),
      },
    };
  }

  // 🎯 ساخت فیلترها برای محصولات یک برند
  async buildFiltersForBrand(brandId: number) {
    // ------------------------------------------
    // ۱. دسته‌بندی‌های این برند
    // ------------------------------------------
    const categories = await this.dataSource.query(
      `
      SELECT c.id, c.title, c.slug, COUNT(p.id) as count
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1 AND p.brand_id = ?
      GROUP BY c.id, c.title, c.slug
      `,
      [brandId],
    );

    // ------------------------------------------
    // ۲. ویژگی‌ها از product_attribute_values
    // ------------------------------------------
    const productAttrs = await this.dataSource.query(
      `
      SELECT DISTINCT
        a.id AS attribute_id,
        a.name AS attribute_name,
        a.type AS attribute_type,
        av.id AS attribute_value_id,
        av.value AS attribute_value,
        av.display_color AS attribute_value_color
      FROM attributes a
      INNER JOIN attribute_values av ON av.attribute_id = a.id
      INNER JOIN product_attribute_values pav ON pav.value_id = av.id
      INNER JOIN products p ON p.id = pav.product_id
      WHERE p.is_active = 1
        AND p.brand_id = ?
        AND av.value IS NOT NULL
      `,
      [brandId],
    );

    // ------------------------------------------
    // ۳. ویژگی‌های واریانت از variant_attribute_values
    // ------------------------------------------
    const variantAttrs = await this.dataSource.query(
      `
      SELECT DISTINCT
        a.id AS attribute_id,
        a.name AS attribute_name,
        a.type AS attribute_type,
        av.id AS attribute_value_id,
        av.value AS attribute_value,
        av.display_color AS attribute_value_color
      FROM attributes a
      INNER JOIN attribute_values av ON av.attribute_id = a.id
      INNER JOIN variant_attribute_values vav ON vav.value_id = av.id
      INNER JOIN variants_product v ON v.id = vav.variant_id
      INNER JOIN products p ON p.id = v.product_id
      WHERE p.is_active = 1
        AND p.brand_id = ?
        AND av.value IS NOT NULL
      `,
      [brandId],
    );

    // ------------------------------------------
    // ۴. ترکیب نتایج product + variant و حذف تکراری‌ها
    // ------------------------------------------
    const attributesRaw = [...productAttrs, ...variantAttrs];
    const attributeMap = new Map<
      number,
      { id: number; name: string; type: string; values: AttributeValue[] }
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
      if (
        row.attribute_value &&
        row.attribute_value_id &&
        !attr.values.some((v) => v.id === row.attribute_value_id)
      ) {
        attr.values.push({
          id: row.attribute_value_id,
          value: row.attribute_value,
          displayColor: row.attribute_value_color ?? null,
        });
      }
    }

    // ------------------------------------------
    // ۵. بازه قیمت
    // ------------------------------------------
    const priceRange = await this.dataSource.query(
      `
      SELECT 
        MIN(p.price - COALESCE(p.discount_amount, 0)) as min,
        MAX(p.price - COALESCE(p.discount_amount, 0)) as max
      FROM products p
      WHERE p.is_active = 1 AND p.brand_id = ?
      `,
      [brandId],
    );

    // ------------------------------------------
    // ۶. خروجی نهایی
    // ------------------------------------------
    return {
      attributes: Array.from(attributeMap.values()),
      generic: {
        boolean_filter: {
          special_offer: {
            type: 'boolean',
            label: 'فقط محصولات پیشنهاد ویژه',
          },
          discounted: {
            type: 'boolean',
            label: 'فقط محصولات دارای تخفیف'
          },
          same_day_shipping: {
            type: 'boolean',
            label: 'ارسال سریع',
          },
          in_stock: {
            type: 'boolean',
            label: 'فقط محصولات موجود در انبار',
          },
        },
        price_range: {
          min: Number(priceRange[0]?.min) || 0,
          max: Number(priceRange[0]?.max) || 0,
        },
        categories: categories.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          count: Number(c.count),
        })),
      },
    };
  }
}