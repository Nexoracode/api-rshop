import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPromotionIdToHomeSection1767200000000 implements MigrationInterface {
    name = 'AddPromotionIdToHomeSection1767200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // اضافه کردن فیلد promotionId
        await queryRunner.addColumn('home_sections', new TableColumn({
            name: 'promotion_id',
            type: 'int',
            isNullable: true,
            comment: 'شناسه پروموشن برای بخش‌های promotion_based'
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // حذف فیلد promotionId
        await queryRunner.dropColumn('home_sections', 'promotion_id');
    }
}
