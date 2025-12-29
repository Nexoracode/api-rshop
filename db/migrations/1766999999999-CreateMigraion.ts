// migration جدید برای تغییرات
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCollectionsAndFixChanges1766999999999 implements MigrationInterface {
    name = 'AddCollectionsAndFixChanges1766999999999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ۱. جدول collections رو اضافه کن (اگر وجود نداره)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`collections\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`title\` varchar(191) NOT NULL,
                \`slug\` varchar(191) NOT NULL,
                \`description\` text NULL,
                \`image\` varchar(500) NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`sort_order\` int NOT NULL DEFAULT '0',
                \`start_date\` timestamp NULL,
                \`end_date\` timestamp NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_e058d0b586201dcc5246c00ac0\` (\`title\`),
                UNIQUE INDEX \`IDX_99d0d14f9f23b45d2c6648c4b5\` (\`slug\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // ۲. جدول میانی collection_products
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`collection_products\` (
                \`collection_id\` int NOT NULL,
                \`product_id\` int NOT NULL,
                INDEX \`IDX_e87d3f6a1fa89a197975d3fc52\` (\`collection_id\`),
                INDEX \`IDX_862459bc848778744e0370048d\` (\`product_id\`),
                PRIMARY KEY (\`collection_id\`, \`product_id\`)
            ) ENGINE=InnoDB
        `);

        // ۳. اضافه کردن promo_banners (اگر نیازه)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`promo_banners\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`title\` varchar(191) NOT NULL,
                \`image_url\` varchar(500) NOT NULL,
                \`link\` varchar(500) NULL,
                \`link_text\` varchar(100) NULL,
                \`background_color\` varchar(20) NULL,
                \`text_color\` varchar(20) NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`is_closable\` tinyint NOT NULL DEFAULT 1,
                \`priority\` int NOT NULL DEFAULT '0',
                \`start_date\` timestamp NULL,
                \`end_date\` timestamp NULL,
                \`display_duration\` int NULL COMMENT 'مدت نمایش به ثانیه',
                \`description\` text NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // ۴. اصلاح enum در payments (اضافه کردن meli)
        await queryRunner.query(`
            ALTER TABLE \`payments\` 
            MODIFY COLUMN \`gateway\` 
            enum('zarinpal', 'idpay', 'melat', 'meli') 
            NOT NULL DEFAULT 'zarinpal'
        `);

        // ۵. اضافه کردن foreign keyها
        await queryRunner.query(`
            ALTER TABLE \`collection_products\` 
            ADD CONSTRAINT \`FK_e87d3f6a1fa89a197975d3fc527\` 
            FOREIGN KEY (\`collection_id\`) 
            REFERENCES \`collections\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE \`collection_products\` 
            ADD CONSTRAINT \`FK_862459bc848778744e0370048de\` 
            FOREIGN KEY (\`product_id\`) 
            REFERENCES \`products\`(\`id\`) 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback
        await queryRunner.query(`ALTER TABLE \`collection_products\` DROP FOREIGN KEY \`FK_862459bc848778744e0370048de\``);
        await queryRunner.query(`ALTER TABLE \`collection_products\` DROP FOREIGN KEY \`FK_e87d3f6a1fa89a197975d3fc527\``);
        await queryRunner.query(`ALTER TABLE \`payments\` MODIFY COLUMN \`gateway\` enum('zarinpal', 'idpay', 'melat') NOT NULL DEFAULT 'zarinpal'`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`promo_banners\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`collection_products\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`collections\``);
    }
}