import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class RemoveUserIdFromPromotionCondition1736008000000 implements MigrationInterface {
    name = 'RemoveUserIdFromPromotionCondition1736008000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // حذف فیلد user_id از جدول promotion_conditions
        await queryRunner.dropColumn('promotion_conditions', 'user_id');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // بازگرداندن فیلد user_id
        await queryRunner.addColumn('promotion_conditions', new TableColumn({
            name: 'user_id',
            type: 'int',
            isNullable: true,
            comment: 'شناسه یک کاربر خاص (deprecated)'
        }));
    }
}
