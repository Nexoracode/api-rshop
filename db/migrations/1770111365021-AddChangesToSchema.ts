// src/migration/1770111365021-AddChangesToSchema.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChangesToSchema1770111365021 implements MigrationInterface {
    name = 'AddChangesToSchema1770111365021'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ۱. اضافه کردن status جدید به orders
        await queryRunner.query(`
            ALTER TABLE \`orders\` 
            MODIFY COLUMN \`status\` 
            enum ('start_order', 'pending_approval', 'awaiting_payment', 'payment_confirmation_pending', 'processing', 'preparing', 'shipping', 'delivered', 'not_delivered', 'expired', 'rejected', 'refunded', 'payment_failed', 'cancelled') 
            NOT NULL DEFAULT 'awaiting_payment'
        `);

        // ۲. تغییر is_approved در reviews به nullable
        await queryRunner.query(`
            ALTER TABLE \`reviews\` 
            MODIFY COLUMN \`is_approved\` 
            tinyint NULL
        `);

        // ۳. اضافه کردن فیلد image به home_sections
        await queryRunner.query(`
            ALTER TABLE \`home_sections\` 
            ADD COLUMN IF NOT EXISTS \`image\` varchar(500) NULL
        `);

        // ۴. تغییر user_id به user_ids در promotion_conditions
        await queryRunner.query(`
            ALTER TABLE \`promotion_conditions\` 
            CHANGE COLUMN \`user_id\` \`user_ids\` json NULL
        `);

        // ۵. اضافه کردن max_discount_amount به promotions
        await queryRunner.query(`
            ALTER TABLE \`promotions\` 
            ADD COLUMN IF NOT EXISTS \`max_discount_amount\` decimal(15,2) NULL COMMENT 'حداکثر مبلغ تخفیف قابل اعمال (سقف تخفیف)'
        `);

        // ۶. اضافه کردن جدول short_urls
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`short_urls\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`code\` varchar(10) NOT NULL,
                \`original_url\` text NOT NULL,
                \`click_count\` int NOT NULL DEFAULT '0',
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`expires_at\` timestamp NULL,
                UNIQUE INDEX \`IDX_36d7fc390c3e722f91a4683883\` (\`code\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // ۷. اضافه کردن 'homepage' به enum category در settings
        await queryRunner.query(`
            ALTER TABLE \`settings\` 
            MODIFY COLUMN \`category\` 
            enum ('general', 'payment', 'shipping', 'email', 'sms', 'social', 'seo', 'homepage') 
            NOT NULL DEFAULT 'general'
        `);

        // ۸. تغییر نام فیلدها از sort_order به display_order
        await queryRunner.query(`
            ALTER TABLE \`side_banners\` 
            CHANGE COLUMN \`sort_order\` \`display_order\` int NOT NULL DEFAULT '0'
        `);

        await queryRunner.query(`
            ALTER TABLE \`promo_banners\` 
            CHANGE COLUMN \`priority\` \`display_order\` int NOT NULL DEFAULT '0'
        `);

        await queryRunner.query(`
            ALTER TABLE \`home_sections\` 
            CHANGE COLUMN \`sort_order\` \`display_order\` int NOT NULL DEFAULT '0'
        `);

        await queryRunner.query(`
            ALTER TABLE \`hero_sliders\` 
            CHANGE COLUMN \`sort_order\` \`display_order\` int NOT NULL DEFAULT '0'
        `);

        await queryRunner.query(`
            ALTER TABLE \`collections\` 
            CHANGE COLUMN \`sort_order\` \`display_order\` int NOT NULL DEFAULT '0'
        `);

        // ۹. اضافه کردن 'promotion_based' به enum section_type در home_sections
        await queryRunner.query(`
            ALTER TABLE \`home_sections\` 
            MODIFY COLUMN \`section_type\` 
            enum ('featured', 'special_products', 'most_popular', 'category_based', 'promotion_based') 
            NOT NULL DEFAULT 'featured'
        `);

        // ۱۰. اضافه کردن start_date و end_date به home_sections
        await queryRunner.query(`
            ALTER TABLE \`home_sections\` 
            ADD COLUMN IF NOT EXISTS \`start_date\` timestamp NULL,
            ADD COLUMN IF NOT EXISTS \`end_date\` timestamp NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback تغییرات
        await queryRunner.query(`ALTER TABLE \`home_sections\` DROP COLUMN \`end_date\``);
        await queryRunner.query(`ALTER TABLE \`home_sections\` DROP COLUMN \`start_date\``);

        await queryRunner.query(`
            ALTER TABLE \`home_sections\` 
            MODIFY COLUMN \`section_type\` 
            enum ('featured', 'special_products', 'most_popular', 'category_based') 
            NOT NULL DEFAULT 'featured'
        `);

        await queryRunner.query(`ALTER TABLE \`hero_sliders\` CHANGE COLUMN \`display_order\` \`sort_order\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`collections\` CHANGE COLUMN \`display_order\` \`sort_order\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`home_sections\` CHANGE COLUMN \`display_order\` \`sort_order\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`promo_banners\` CHANGE COLUMN \`display_order\` \`priority\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`side_banners\` CHANGE COLUMN \`display_order\` \`sort_order\` int NOT NULL DEFAULT '0'`);

        await queryRunner.query(`
            ALTER TABLE \`settings\` 
            MODIFY COLUMN \`category\` 
            enum ('general', 'payment', 'shipping', 'email', 'sms', 'social', 'seo') 
            NOT NULL DEFAULT 'general'
        `);

        await queryRunner.query(`DROP TABLE IF EXISTS \`short_urls\``);

        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`max_discount_amount\``);

        await queryRunner.query(`ALTER TABLE \`promotion_conditions\` CHANGE COLUMN \`user_ids\` \`user_id\` int NULL`);

        await queryRunner.query(`ALTER TABLE \`home_sections\` DROP COLUMN \`image\``);

        await queryRunner.query(`
            ALTER TABLE \`reviews\` 
            MODIFY COLUMN \`is_approved\` 
            tinyint NOT NULL DEFAULT 0
        `);

        await queryRunner.query(`
            ALTER TABLE \`orders\` 
            MODIFY COLUMN \`status\` 
            enum ('pending_approval', 'awaiting_payment', 'payment_confirmation_pending', 'processing', 'preparing', 'shipping', 'delivered', 'not_delivered', 'expired', 'rejected', 'refunded', 'payment_failed', 'cancelled') 
            NOT NULL DEFAULT 'awaiting_payment'
        `);
    }
}