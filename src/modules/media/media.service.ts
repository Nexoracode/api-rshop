import { BadRequestException, Injectable } from '@nestjs/common';
import { Readable } from 'typeorm/platform/PlatformTools';
import { CreateMediaDto } from './dto/upload-file.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Media } from './entities/image.entity';
import { Repository } from 'typeorm';
import { MediaType } from 'src/common/enums/media.enum';
import { UploadService } from 'src/common/services/upload.service';
@Injectable()
export class MediaService {
    constructor(
        @InjectRepository(Media)
        private readonly mediaRepo: Repository<Media>,
        private readonly uploadService: UploadService,
    ) { }


    async uploadFile(files: Express.Multer.File[], context: MediaType) {
        if (!files || files.length === 0) throw new BadRequestException('فایلی ارسال نشده است');
        const maxFiles = context === (MediaType.CATEGORY || MediaType.BRAND || MediaType.HELPER) ? 1 : 10;
        if (files.length > maxFiles) throw new BadRequestException(`حداکثر فایل مجاز : ${maxFiles}`);
        const uploaded: Media[] = [];
        for (const file of files) {
            const ext = file.originalname.split('.').pop();
            const format = file.mimetype.split('/')[0];
            if (context === (MediaType.CATEGORY || MediaType.BRAND || MediaType.HELPER) && format !== 'image') throw new BadRequestException('فقط عکس مجاز می باشد.');
            const filename = `file-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
            const url = await this.uploadService.uploadFileToServer(file.buffer, context, filename);
            if (!url || typeof url !== 'string') {
                throw new BadRequestException(`Failed to upload image : ${file.originalname}`)
            }
            const media = this.mediaRepo.create({
                type: format,
                url,
            })
            const saved = await this.mediaRepo.save(media);
            uploaded.push(saved);
        }
        return {
            message: 'آپلود فایل با موفقیت انجام شد',
            data: uploaded.map((m) => ({ id: m.id, url: m.url, type: m.type }))
        }
    }
}
