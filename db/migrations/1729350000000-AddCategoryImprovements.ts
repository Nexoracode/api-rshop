import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm";

export class AddCategoryImprovements1729350000000 implements MigrationInterface {
    name = 'AddCategoryImprovements1729350000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add display_order column
        await queryRunner.addColumn('categories', new TableColumn({
            name: 'display_order',
            type: 'int',
            default: 0,
            isNullable: false,
        }));

        // Add is_active column
        await queryRunner.addColumn('categories', new TableColumn({
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
        }));

        // Add index on slug for better performance
        await queryRunner.createIndex('categories', new TableIndex({
            name: 'IDX_CATEGORY_SLUG',
            columnNames: ['slug']
        }));

        // Add index on title for better search performance
        await queryRunner.createIndex('categories', new TableIndex({
            name: 'IDX_CATEGORY_TITLE',
            columnNames: ['title']
        }));

        // Add composite index for parent_id and is_active
        await queryRunner.createIndex('categories', new TableIndex({
            name: 'IDX_CATEGORY_PARENT_ACTIVE',
            columnNames: ['parent_id', 'is_active']
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.dropIndex('categories', 'IDX_CATEGORY_PARENT_ACTIVE');
        await queryRunner.dropIndex('categories', 'IDX_CATEGORY_TITLE');
        await queryRunner.dropIndex('categories', 'IDX_CATEGORY_SLUG');

        // Drop columns
        await queryRunner.dropColumn('categories', 'is_active');
        await queryRunner.dropColumn('categories', 'display_order');
    }
}
