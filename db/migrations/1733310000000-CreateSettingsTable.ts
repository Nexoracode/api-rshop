import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateSettingsTable1733310000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "settings",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "key",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                    },
                    {
                        name: "value",
                        type: "text",
                    },
                    {
                        name: "description",
                        type: "varchar",
                        length: "500",
                        isNullable: true,
                    },
                    {
                        name: "category",
                        type: "enum",
                        enum: ['general', 'payment', 'shipping', 'email', 'sms', 'social', 'seo'],
                        default: "'general'",
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        await queryRunner.createIndex(
            "settings",
            new TableIndex({
                name: "IDX_settings_category",
                columnNames: ["category"],
            })
        );

        await queryRunner.query(`
            INSERT INTO settings (\`key\`, value, description, category) VALUES
            ('shop_card_number', '6037-9912-0000-0000', 'شماره کارت فروشگاه برای پرداخت کارت به کارت', 'payment'),
            ('shop_card_holder', 'فروشگاه آنلاین', 'نام صاحب کارت', 'payment'),
            ('shop_bank_name', 'بانک ملی', 'نام بانک', 'payment'),
            ('shop_iban', 'IR00-0000-0000-0000-0000-0000-00', 'شماره شبا', 'payment'),
            ('shop_name', 'RSHOP', 'نام فروشگاه', 'general'),
            ('shop_phone', '021-12345678', 'تلفن فروشگاه', 'general'),
            ('shop_email', 'info@rshop.com', 'ایمیل فروشگاه', 'general'),
            ('shop_address', 'تهران، خیابان ولیعصر', 'آدرس فروشگاه', 'general'),
            ('shipping_default_cost', '50000', 'هزینه پیش‌فرض ارسال (تومان)', 'shipping'),
            ('free_shipping_threshold', '500000', 'آستانه ارسال رایگان (تومان)', 'shipping')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex("settings", "IDX_settings_category");
        await queryRunner.dropTable("settings");
    }
}
