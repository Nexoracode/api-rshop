import * as dotenv from "dotenv";
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envFile });
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const dataSourceOption: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
        'dist/**/*.entity{.js,.ts}',
        'dist/**/*.orm-entity{.ts,.js}'
    ],
    migrations: [__dirname + '/migrations/*.js'],
    // logging: process.env.NODE_ENV !== 'production',
    logging: false,
    synchronize: process.env.NODE_ENV === 'development',
    extra: {
        connectionLimit: 10,
        idleTimeoutMillis: 30000,
        enableKeepAlive: true,
        keepAliveInitialDelayMillis: 0,
        // خودکار reconnect
        waitForConnections: true,
        queueLimit: 0,
    },
    // synchronize: false,
    namingStrategy: new SnakeNamingStrategy(),
    timezone: '+03:30',
    // dropSchema: true,
    cache: {
        duration: 30000,
    },
    migrationsRun: false,
    connectTimeout: 60000,
};

const dataSource = new DataSource(dataSourceOption);
export default dataSource;

console.log(`.env.${process.env.NODE_ENV}`)