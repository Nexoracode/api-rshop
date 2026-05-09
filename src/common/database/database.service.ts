import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DatabaseService.name);
    private keepAliveInterval!: NodeJS.Timeout;
    private isReconnecting = false;

    constructor(
        @InjectDataSource()
        private dataSource: DataSource,
    ) { }

    async onModuleInit() {
        this.startKeepAlive();
        this.startConnectionMonitor();
    }

    async onModuleDestroy() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }
    }

    /**
     * هر 45 ثانیه یک کوئری ساده می‌زنه تا اتصال زنده بمونه
     */
    private startKeepAlive() {
        this.keepAliveInterval = setInterval(async () => {
            try {
                if (this.dataSource?.isInitialized) {
                    await this.dataSource.query('SELECT 1');
                    this.logger.debug('✅ Keep-alive query successful');
                }
            } catch (error: any) {
                this.logger.warn(`⚠️ Keep-alive query failed: ${error.message}`);
                await this.reconnect();
            }
        }, 45000); // هر 45 ثانیه
    }

    /**
     * مانیتور کردن سلامت اتصال
     */
    private startConnectionMonitor() {
        setInterval(async () => {
            try {
                const isConnected = this.dataSource?.isInitialized;
                if (!isConnected) {
                    this.logger.warn('⚠️ Connection lost, attempting to reconnect...');
                    await this.reconnect();
                }
            } catch (error: any) {
                this.logger.error(`❌ Monitor error: ${error.message}`);
            }
        }, 10000); // هر 10 ثانیه چک کن
    }

    /**
     * reconnect خودکار با retry
     */
    async reconnect(): Promise<void> {
        if (this.isReconnecting) {
            this.logger.debug('Already reconnecting, skipping...');
            return;
        }

        this.isReconnecting = true;
        this.logger.warn('🔄 Attempting to reconnect to database...');

        try {
            // بستن اتصال قدیمی اگر وجود داره
            if (this.dataSource?.isInitialized) {
                await this.dataSource.destroy();
                this.logger.log('🔌 Old connection destroyed');
            }

            // تلاش برای اتصال مجدد با retry
            for (let attempt = 1; attempt <= 5; attempt++) {
                try {
                    await this.dataSource.initialize();
                    this.logger.log(`✅ Reconnected successfully on attempt ${attempt}`);
                    this.isReconnecting = false;
                    return;
                } catch (error: any) {
                    this.logger.error(`❌ Reconnection attempt ${attempt} failed: ${error.message}`);
                    if (attempt < 5) {
                        await this.sleep(3000 * attempt); // افزایش زمان بین تلاش‌ها
                    }
                }
            }

            this.logger.error('❌ Failed to reconnect after 5 attempts');
        } catch (error: any) {
            this.logger.error(`❌ Reconnection error: ${error.message}`);
        } finally {
            this.isReconnecting = false;
        }
    }

    /**
     * اجرای کوئری با قابلیت retry خودکار
     */
    async executeWithRetry<T>(
        queryFn: () => Promise<T>,
        maxRetries: number = 3,
    ): Promise<T> {
        let lastError: any;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // چک کردن اتصال قبل از اجرا
                if (!this.dataSource?.isInitialized) {
                    this.logger.warn('Connection not initialized, reconnecting...');
                    await this.reconnect();
                }

                return await queryFn();
            } catch (error: any) {
                lastError = error;
                // فقط روی خطاهای اتصال retry کن
                const isConnectionError =
                    error.code === 'ECONNRESET' ||
                    error.code === 'PROTOCOL_CONNECTION_LOST' ||
                    error.code === 'ER_CON_COUNT_ERROR' ||
                    error.code === 'ECONNREFUSED' ||
                    error.message?.includes('Connection lost');

                if (!isConnectionError) {
                    throw error; // خطای غیر اتصالی رو مستقیم بده بیرون
                }

                this.logger.warn(
                    `Connection error (attempt ${attempt}/${maxRetries}): ${error.message}`,
                );

                if (attempt < maxRetries) {
                    await this.reconnect();
                    await this.sleep(1000 * attempt); // انتظار exponential backoff
                }
            }
        }

        throw lastError;
    }

    /**
     * هِلپِر برای گرفتن Repository با قابلیت retry
     */
    getRepository(entity: any) {
        return {
            find: (options?: any) =>
                this.executeWithRetry(() => this.dataSource.getRepository(entity).find(options)),
            findOne: (options?: any) =>
                this.executeWithRetry(() => this.dataSource.getRepository(entity).findOne(options)),
            save: (data: any) =>
                this.executeWithRetry(() => this.dataSource.getRepository(entity).save(data)),
            update: (criteria: any, data: any) =>
                this.executeWithRetry(() => this.dataSource.getRepository(entity).update(criteria, data)),
            delete: (criteria: any) =>
                this.executeWithRetry(() => this.dataSource.getRepository(entity).delete(criteria)),
            query: (query: string, params?: any[]) =>
                this.executeWithRetry(() => this.dataSource.query(query, params)),
            createQueryBuilder: (alias: string) =>
                this.dataSource.getRepository(entity).createQueryBuilder(alias),
        };
    }

    /**
     * هِلپِر برای Transaction با retry
     */
    async transaction<T>(callback: (manager: any) => Promise<T>): Promise<T> {
        return this.executeWithRetry(async () => {
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                const result = await callback(queryRunner.manager);
                await queryRunner.commitTransaction();
                return result;
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                throw error;
            } finally {
                await queryRunner.release();
            }
        });
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}