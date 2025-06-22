import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as service from 'basic-ftp';
import { Readable } from "typeorm/platform/PlatformTools";
import { MediaType } from "../enums/media.enum";

@Injectable()
export class UploadService {
    private client: service.Client;

    constructor() {
        this.client = new service.Client();
        this.client.ftp.verbose = false;
    }

    async uploadFileToServer(
        buffer: Buffer,
        remotePath: string,
        filename: string,
    ): Promise<string> {
        try {
            await this.client.access({
                host: `ftp.${process.env.FTP_HOST}`,
                user: process.env.FTP_USERNAME,
                password: process.env.FTP_PASSWORD,
                secure: false,
            });

            await this.client.ensureDir(`Rshop/${remotePath}`);
            await this.client.uploadFrom(Readable.from(buffer), filename);
            this.client.close();

            return `https://dl.${process.env.FTP_HOST}/${remotePath}/${filename}`;
        } catch (error) {
            console.error('FTP upload error:', error);
            throw error;
        }
    }

    async deleteFileByUrl(fileUrl: string): Promise<void> {
        try {
            const parsedUrl = new URL(fileUrl);
            console.log(parsedUrl);
            const filePath = parsedUrl.pathname.startsWith('/')
                ? parsedUrl.pathname.slice(1)
                : parsedUrl.pathname;

            await this.client.access({
                host: `ftp.${process.env.FTP_HOST}`,
                user: process.env.FTP_USERNAME,
                password: process.env.FTP_PASSWORD,
                secure: false,
            });
            if (!filePath.startsWith(MediaType.CATEGORY) && !filePath.startsWith(MediaType.PRODUCT) && !filePath.startsWith(MediaType.USER)) {
                throw new Error('دسترسی غیرمجاز به مسیر فایل');
            }
            await this.client.remove(`Rshop${parsedUrl.pathname}`);
            console.log('فایل حذف شد:', filePath);
        } catch (err) {
            console.error('خطا در حذف فایل از FTP:', err.message);
            throw new Error('حذف فایل با خطا مواجه شد.');
        } finally {
            this.client.close();
        }
    }
}