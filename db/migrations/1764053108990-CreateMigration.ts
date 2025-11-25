import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMigration1764053108990 implements MigrationInterface {
    name = 'CreateMigration1764053108990'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`otps\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(255) NOT NULL, \`code\` varchar(255) NOT NULL, \`expire_at\` datetime NOT NULL, \`verified\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`promotion_conditions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('user', 'product', 'category', 'variant', 'min_order_amount', 'first_order') NOT NULL, \`user_id\` int NULL, \`product_ids\` json NULL, \`category_ids\` json NULL, \`variant_ids\` json NULL, \`min_amount\` decimal(15,2) NULL, \`promotion_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`promotion_actions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('percent_discount', 'amount_discount', 'free_shipping', 'next_order_coupon') NOT NULL, \`value\` decimal(15,2) NULL, \`meta\` json NULL, \`promotion_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`promotions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`type\` enum ('coupon', 'flash_deal', 'free_shipping', 'first_order', 'next_order_reward') NOT NULL, \`code\` varchar(50) NULL, \`starts_at\` datetime NOT NULL, \`ends_at\` datetime NOT NULL, \`usage_limit\` int NULL, \`used_count\` int NOT NULL DEFAULT '0', \`is_active\` tinyint NOT NULL DEFAULT '1', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`promotion_conditions\` ADD CONSTRAINT \`FK_0874e50cf190d2ebf50d725fccc\` FOREIGN KEY (\`promotion_id\`) REFERENCES \`promotions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`promotion_actions\` ADD CONSTRAINT \`FK_e79291bf9f5d1262f3ae07c3999\` FOREIGN KEY (\`promotion_id\`) REFERENCES \`promotions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`promotion_actions\` DROP FOREIGN KEY \`FK_e79291bf9f5d1262f3ae07c3999\``);
        await queryRunner.query(`ALTER TABLE \`promotion_conditions\` DROP FOREIGN KEY \`FK_0874e50cf190d2ebf50d725fccc\``);
        await queryRunner.query(`DROP TABLE \`promotions\``);
        await queryRunner.query(`DROP TABLE \`promotion_actions\``);
        await queryRunner.query(`DROP TABLE \`promotion_conditions\``);
        await queryRunner.query(`DROP TABLE \`otps\``);
    }

}
