import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/image.entity';
import { UploadService } from 'src/common/services/upload.service';

@Module({
    imports: [TypeOrmModule.forFeature([Media])],
    providers: [MediaService, UploadService],
    exports: [MediaService],
})
export class MediaModule { }
