import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIconToCategoriesAndFaqCategoryTable1771500000000 implements MigrationInterface {
  name = 'AddIconToCategoriesAndFaqCategoryTable1771500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ۱. اضافه کردن ستون icon_id به جدول categories (FK به icons)
    await queryRunner.query(`
      ALTER TABLE \`categories\`
      ADD COLUMN \`icon_id\` int NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`categories\`
      ADD CONSTRAINT \`FK_categories_icon_id\`
      FOREIGN KEY (\`icon_id\`) REFERENCES \`icons\` (\`id\`) ON DELETE SET NULL
    `);

    // ۲. ساخت جدول faq_categories
    await queryRunner.query(`
      CREATE TABLE \`faq_categories\` (
        \`id\`            int          NOT NULL AUTO_INCREMENT,
        \`name\`          varchar(100) NOT NULL,
        \`icon_id\`       int          NULL,
        \`display_order\` int          NOT NULL DEFAULT 0,
        \`is_active\`     tinyint      NOT NULL DEFAULT 1,
        \`created_at\`    datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\`    datetime(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_faq_categories_name\` (\`name\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_faq_categories_icon_id\`
          FOREIGN KEY (\`icon_id\`) REFERENCES \`icons\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB
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

    // ۵. اضافه کردن FK برای faq_category_id
    await queryRunner.query(`
      ALTER TABLE \`faqs\`
      ADD CONSTRAINT \`FK_faqs_faq_category_id\`
      FOREIGN KEY (\`faq_category_id\`) REFERENCES \`faq_categories\` (\`id\`) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`faqs\` DROP FOREIGN KEY \`FK_faqs_faq_category_id\``);
    await queryRunner.query(`ALTER TABLE \`faqs\` ADD COLUMN \`category\` varchar(255) NULL`);
    await queryRunner.query(`ALTER TABLE \`faqs\` DROP COLUMN \`faq_category_id\``);

    await queryRunner.query(`DROP TABLE IF EXISTS \`faq_categories\``);

    await queryRunner.query(`ALTER TABLE \`categories\` DROP FOREIGN KEY \`FK_categories_icon_id\``);
    await queryRunner.query(`ALTER TABLE \`categories\` DROP COLUMN \`icon_id\``);
  }
}
