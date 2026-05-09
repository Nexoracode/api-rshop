import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { dataSourceOption } from 'db/data-source';

@Global() // این باعث می‌شود همه جا در دسترس باشد بدون نیاز به import
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: () => dataSourceOption,
        }),
    ],
    providers: [DatabaseService],
    exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule { }