import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHomePageLayoutSetting1735576800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // اضافه کردن setting برای HomePage Layout
        await queryRunner.query(`
            INSERT INTO setting (\`key\`, value, category, description, is_public, created_at, updated_at)
            VALUES (
                'homepage_layout_type',
                'side_by_side',
                'homepage',
                'نوع چیدمان صفحه اصلی: side_by_side (کنار هم) یا stacked (زیر هم)',
                1,
                NOW(),
                NOW()
            )
            ON DUPLICATE KEY UPDATE 
                category = 'homepage',
                description = 'نوع چیدمان صفحه اصلی: side_by_side (کنار هم) یا stacked (زیر هم)'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // حذف setting
        await queryRunner.query(`
            DELETE FROM setting WHERE \`key\` = 'homepage_layout_type'
        `);
    }
}
