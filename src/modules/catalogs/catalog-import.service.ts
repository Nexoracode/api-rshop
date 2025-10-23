import { Injectable, Logger } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { Brand } from "../brand/entities/brand.entity";
import { Category } from "../category/entities/category.entity";
import { Product } from "../product/entities/product.entity";
import * as fs from "fs";
import * as path from "path";
import { Media } from "../media/entities/image.entity";

@Injectable()
export class CatalogImportService {
    private readonly logger = new Logger(CatalogImportService.name);

    constructor(private readonly dataSource: DataSource) { }

    async run() {
        const basePath = path.join(process.cwd(), "src/jsons");
        this.logger.log(`📂 Loading JSONs from: ${basePath}`);

        const brands = JSON.parse(fs.readFileSync(path.join(basePath, "brands.json"), "utf8")).brands;
        const categories = JSON.parse(fs.readFileSync(path.join(basePath, "categories.json"), "utf8")).categories;
        const products = JSON.parse(fs.readFileSync(path.join(basePath, "products.json"), "utf8")).products;

        this.logger.log(`🟣 Found ${brands.length} brands, ${categories.length} categories, ${products.length} products`);

        await this.dataSource.transaction(async (manager) => {
            await this.importBrands(manager, brands);
            await this.importCategories(manager, categories);
            await this.rebuildCategoryClosure(manager);
            await this.importMedias(manager, products);
            await this.importProducts(manager, products);
        });

        this.logger.log("🎉 Catalog data imported and updated successfully!");
    }

    // ========================= 1️⃣ BRANDS =========================
    private async importBrands(manager: EntityManager, brands: any[]) {
        await manager
            .createQueryBuilder()
            .insert()
            .into(Brand)
            .values(brands)
            .orUpdate(["name", "logo"], ["id"])
            .execute();
        this.logger.log("✅ Brands inserted/updated");
    }

    // ========================= 2️⃣ CATEGORIES =========================
    private async importCategories(manager: EntityManager, categories: any[]) {
        this.logger.log("⏳ Inserting categories hierarchically...");

        const flatList: any[] = [];
        const traverse = (nodes: any[], parentId: number | null = null) => {
            for (const node of nodes) {
                const { children, parent, ...rest } = node;
                flatList.push({ ...rest, parentId });
                if (children?.length) traverse(children, node.id);
            }
        };
        traverse(categories);
        flatList.sort((a, b) => a.level - b.level);

        const insertedMap = new Map<number, number>();

        for (const cat of flatList) {
            const parentRealId = cat.parentId ? insertedMap.get(cat.parentId) ?? cat.parentId : null;

            const result = await manager
                .createQueryBuilder()
                .insert()
                .into(Category)
                .values({
                    id: cat.id,
                    title: cat.title,
                    slug: cat.slug,
                    level: cat.level,
                    discount: cat.discount,
                    parentId: parentRealId,
                })
                .orUpdate(["title", "slug", "discount", "level", "parent_id"], ["id"])
                .execute();

            if (result.identifiers?.length) {
                insertedMap.set(cat.id, result.identifiers[0].id ?? cat.id);
            } else {
                insertedMap.set(cat.id, cat.id);
            }
        }

        this.logger.log("✅ Categories inserted/updated with correct parentId");
    }

    // ========================= 3️⃣ REBUILD CLOSURE =========================
    private async rebuildCategoryClosure(manager: EntityManager) {
        this.logger.log("🌿 Rebuilding categories_closure table...");

        // پاک‌سازی کامل جدول closure
        await manager.query(`DELETE FROM categories_closure`);

        // افزودن ارتباط مستقیم هر دسته با خودش
        await manager.query(`
      INSERT INTO categories_closure (id_ancestor, id_descendant)
      SELECT id, id FROM categories;
    `);

        // افزودن روابط والد/فرزند تا زمانی که تمام مسیرها ساخته بشن
        let inserted = 0;
        do {
            const result = await manager.query(`
        INSERT INTO categories_closure (id_ancestor, id_descendant)
        SELECT c.parent_id, cc.id_descendant
        FROM categories c
        JOIN categories_closure cc ON cc.id_ancestor = c.id
        WHERE c.parent_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM categories_closure existing
            WHERE existing.id_ancestor = c.parent_id
              AND existing.id_descendant = cc.id_descendant
          );
      `);
            inserted = result?.affectedRows ?? result?.rowCount ?? 0;
        } while (inserted > 0);

        this.logger.log("✅ categories_closure rebuilt successfully");
    }

    // ========================= 3️⃣ MEDIAS =========================
    private async importMedias(manager: EntityManager, products: any[]) {
        const medias: any[] = [];
        for (const product of products) {
            if (product.medias?.length) {
                for (const m of product.medias) medias.push(m);
            }
            if (product.mediaPinned) medias.push(product.mediaPinned);
        }

        if (!medias.length) return;

        await manager
            .createQueryBuilder()
            .insert()
            .into(Media)
            .values(medias)
            .orUpdate(["url", "type", "alt_text", "product_id", "category_id", "user_id"], ["id"])
            .execute();

        this.logger.log(`✅ Medias inserted/updated (${medias.length})`);
    }

    // ========================= 4️⃣ PRODUCTS =========================
    private async importProducts(manager: EntityManager, products: any[]) {
        const productsToInsert = products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            discountAmount: p.discountAmount ?? p.discount_amount,
            discountPercent: p.discountPercent ?? p.discount_percent,
            isFeatured: p.isFeatured ?? p.is_featured,
            description: p.description,
            weight: p.weight,
            weightUnit: p.weightUnit ?? p.weight_unit,
            orderLimit: p.orderLimit ?? p.order_limit,
            isVisible: p.isVisible ?? p.is_visible,
            brandId: p.brandId ?? p.brand?.id,
            categoryId: p.categoryId ?? p.category?.id,
            mediaPinnedId: p.mediaPinnedId ?? p.media_pinned?.id ?? null,
            createdAt: p.createdAt ?? p.created_at,
            updatedAt: p.updatedAt ?? p.updated_at,
        }));

        await manager
            .createQueryBuilder()
            .insert()
            .into(Product)
            .values(productsToInsert)
            .orUpdate(
                [
                    "name",
                    "price",
                    "stock",
                    "discount_amount",
                    "discount_percent",
                    "is_featured",
                    "description",
                    "weight",
                    "weight_unit",
                    "order_limit",
                    "is_visible",
                    "brand_id",
                    "category_id",
                    "media_pinned_id",
                    "updated_at",
                ],
                ["id"],
            )
            .execute();

        this.logger.log(`✅ Products inserted/updated (${productsToInsert.length})`);
    }
}

