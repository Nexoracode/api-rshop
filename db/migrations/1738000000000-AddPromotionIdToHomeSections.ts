import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPromotionIdToHomeSections1738000000000 implements MigrationInterface {
  name = 'AddPromotionIdToHomeSections1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // اضافه کردن ستون promotion_id به جدول home_sections
    await queryRunner.addColumn(
      'home_sections',
      new TableColumn({
        name: 'promotion_id',
        type: 'int',
        isNullable: true,
        comment: 'برای بخش‌های بر اساس پروموشن',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // حذف ستون promotion_id
    await queryRunner.dropColumn('home_sections', 'promotion_id');
  }
}
