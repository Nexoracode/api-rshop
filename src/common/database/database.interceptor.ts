// database-keepalive.service.ts
import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseKeepaliveService implements OnModuleInit {
    private readonly logger = new Logger(DatabaseKeepaliveService.name);

    constructor(@Inject(DataSource) private dataSource: DataSource) { }

    onModuleInit() {
        // هر 50 ثانیه یکبار پینگ بزن (کمتر از 60 ثانیه sysctl)
        setInterval(async () => {
            try {
                if (this.dataSource?.isInitialized) {
                    await this.dataSource.query('SELECT 1');
                    this.logger.debug('✅ TCP Keepalive ping');
                }
            } catch (error: any) {
                this.logger.warn(`Ping failed: ${error.message}`);
            }
        }, 50000);
    }
}