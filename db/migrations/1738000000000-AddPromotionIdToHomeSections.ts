import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromotionIdToHomeSections1738000000000 implements MigrationInterface {
  name = 'AddPromotionIdToHomeSections1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`
      ALTER TABLE \`home_sections\`
      DROP COLUMN \`promotion_id\`
    `);
  }
}
