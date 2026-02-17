import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * این migration دیگر استفاده نمی‌شود.
 * محتوای آن به migration 1771500000000 منتقل شده است.
 * به عنوان stub نگه داشته شده تا TypeORM آن را به عنوان "اجرا شده" ثبت کند.
 */
export class AddPromotionIdToHomeSections1738000000000 implements MigrationInterface {
  name = 'AddPromotionIdToHomeSections1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // no-op: این migration در 1771500000000 ادغام شده است
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // no-op
  }
}
