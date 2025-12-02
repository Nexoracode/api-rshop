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

            return `https://dl.${process.env.FTP_HOST}/Rshop/${remotePath}/${filename}`;
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
            
            // ✅ اضافه شد: PAYMENT_RECEIPT
            if (!filePath.startsWith(MediaType.CATEGORY) && 
                !filePath.startsWith(MediaType.PRODUCT) && 
                !filePath.startsWith(MediaType.USER) && 
                !filePath.startsWith(MediaType.BRAND) && 
                !filePath.startsWith(MediaType.HELPER) && 
                !filePath.startsWith(MediaType.GIFT_WRAPPING) &&
                !filePath.startsWith(MediaType.PAYMENT_RECEIPT)) {
                throw new Error('دسترسی غیرمجاز به مسیر فایل');
            }
            
            await this.client.remove(`Rshop${parsedUrl.pathname}`);
        } catch (err) {
            console.error('خطا در حذف فایل از FTP:', err.message);
            throw new Error('حذف فایل با خطا مواجه شد.');
        } finally {
            this.client.close();
        }
    }
}
