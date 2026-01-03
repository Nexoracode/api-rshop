import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUserIdsToPromotionCondition1736007000000 implements MigrationInterface {
    name = 'AddUserIdsToPromotionCondition1736007000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // اضافه کردن فیلد user_ids به جدول promotion_conditions
        await queryRunner.addColumn('promotion_conditions', new TableColumn({
            name: 'user_ids',
            type: 'json',
            isNullable: true,
            comment: 'لیست شناسه کاربران خاص برای پروموشن'
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // حذف فیلد user_ids
        await queryRunner.dropColumn('promotion_conditions', 'user_ids');
    }
}
