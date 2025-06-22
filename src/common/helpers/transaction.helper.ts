// src/common/helpers/transaction.helper.ts
import { DataSource, EntityManager } from 'typeorm';

export async function runInTransaction<T>(
    dataSource: DataSource,
    operation: (manager: EntityManager) => Promise<T>,
): Promise<T> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const result = await operation(queryRunner.manager);
        await queryRunner.commitTransaction();
        return result;
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
}
