import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIconToCategoriesAndFaqCategoryTable1771500000000 implements MigrationInterface {
  name = 'AddIconToCategoriesAndFaqCategoryTable1771500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ۱. اضافه کردن ستون icon به جدول categories
    await queryRunner.query(`
      ALTER TABLE \`categories\`
      ADD COLUMN \`icon\` varchar(500) NULL
    `);

    // ۲. ساخت جدول faq_categories
    await queryRunner.query(`
      CREATE TABLE \`faq_categories\` (
        \`id\`            int          NOT NULL AUTO_INCREMENT,
        \`name\`          varchar(100) NOT NULL,
        \`display_order\` int          NOT NULL DEFAULT 0,
        \`is_active\`     tinyint      NOT NULL DEFAULT 1,
        \`created_at\`    datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\`    datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_faq_categories_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ۳. اضافه کردن ستون faq_category_id به جدول faqs
    await queryRunner.query(`
      ALTER TABLE \`faqs\`
      ADD COLUMN \`faq_category_id\` int NULL
    `);

    // ۴. حذف ستون قدیمی category (رشته‌ای)
    await queryRunner.query(`
      ALTER TABLE \`faqs\`
      DROP COLUMN \`category\`
    `);

    // ۵. اضافه کردن foreign key
    await queryRunner.query(`
      ALTER TABLE \`faqs\`
      ADD CONSTRAINT \`FK_faqs_faq_category_id\`
      FOREIGN KEY (\`faq_category_id\`)
      REFERENCES \`faq_categories\` (\`id\`)
      ON DELETE SET NULL
    `);

    // ۶. اضافه کردن promotion_id به home_sections
    //    (با بررسی وجود قبلی برای جلوگیری از خطا)
    const columns = await queryRunner.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'home_sections'
        AND COLUMN_NAME = 'promotion_id'
    `);
    if (columns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`home_sections\`
        ADD COLUMN \`promotion_id\` int NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // برگشت promotion_id
    await queryRunner.query(`
      ALTER TABLE \`home_sections\`
      DROP COLUMN \`promotion_id\`
    `);

    // برگشت foreign key و ستون faq_category_id
    await queryRunner.query(`
      ALTER TABLE \`faqs\`
      DROP FOREIGN KEY \`FK_faqs_faq_category_id\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`faqs\`
      DROP COLUMN \`faq_category_id\`
    `);

    // برگشت ستون category قدیمی
    await queryRunner.query(`
      ALTER TABLE \`faqs\`
      ADD COLUMN \`category\` varchar(100) NULL
    `);

    // حذف جدول faq_categories
    await queryRunner.query(`DROP TABLE IF EXISTS \`faq_categories\``);

    // حذف ستون icon از categories
    await queryRunner.query(`
      ALTER TABLE \`categories\`
      DROP COLUMN \`icon\`
    `);
  }
}
