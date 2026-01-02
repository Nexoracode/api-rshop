import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShortUrlTable1704200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // چک کنیم جدول وجود داره یا نه
    const tableExists = await queryRunner.hasTable('short_urls');
    
    if (!tableExists) {
      await queryRunner.query(`
        CREATE TABLE short_urls (
          id INT PRIMARY KEY AUTO_INCREMENT,
          code VARCHAR(10) UNIQUE NOT NULL,
          original_url TEXT NOT NULL,
          click_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NULL
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS short_urls`);
  }
}
