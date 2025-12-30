import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMigration1767081916953 implements MigrationInterface {
    name = 'CreateMigration1767081916953'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`settings\` CHANGE \`category\` \`category\` enum ('general', 'payment', 'shipping', 'email', 'sms', 'social', 'seo', 'homepage') NOT NULL DEFAULT 'general'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`settings\` CHANGE \`category\` \`category\` enum ('general', 'payment', 'shipping', 'email', 'sms', 'social', 'seo') NOT NULL DEFAULT 'general'`);
    }

}
