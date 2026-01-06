import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUserIdFromPromotionCondition1736007100000 implements MigrationInterface {
    name = 'RemoveUserIdFromPromotionCondition1736007100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // migrate داده‌های موجود از user_id به user_ids
        await queryRunner.query(`
            UPDATE promotion_conditions 
            SET user_ids = JSON_ARRAY(user_id)
            WHERE user_id IS NOT NULL AND (user_ids IS NULL OR JSON_LENGTH(user_ids) = 0)
        `);

        // حذف ستون user_id
        await queryRunner.dropColumn('promotion_conditions', 'user_id');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // اضافه کردن دوباره ستون user_id
        await queryRunner.query(`
            ALTER TABLE promotion_conditions 
            ADD COLUMN user_id INT NULL
        `);

        // migrate داده‌ها از user_ids به user_id (فقط اولین user)
        await queryRunner.query(`
            UPDATE promotion_conditions 
            SET user_id = JSON_EXTRACT(user_ids, '$[0]')
            WHERE user_ids IS NOT NULL AND JSON_LENGTH(user_ids) > 0
        `);
    }
}
