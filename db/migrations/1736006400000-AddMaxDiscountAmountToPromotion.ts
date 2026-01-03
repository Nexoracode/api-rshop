import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMaxDiscountAmountToPromotion1736006400000 implements MigrationInterface {
    name = 'AddMaxDiscountAmountToPromotion1736006400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // اضافه کردن فیلد max_discount_amount به جدول promotions
        await queryRunner.addColumn('promotions', new TableColumn({
            name: 'max_discount_amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
            comment: 'حداکثر مبلغ تخفیف قابل اعمال (سقف تخفیف)'
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // حذف فیلد max_discount_amount
        await queryRunner.dropColumn('promotions', 'max_discount_amount');
    }
}
