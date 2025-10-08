import { Body, Controller, Param, ParseIntPipe, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { HelperService } from './helper.service';
import { CreateHelperDto } from './dto/create-helper.dto';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadFilesDto } from '../media/dto/upload-file.dto';
import { MediaType } from 'src/common/enums/media.enum';
import { UploadService } from 'src/common/services/upload.service';
import { MediaService } from '../media/media.service';
@ApiTags('11 - 🆘 Helpers')
@Controller('helpers')
export class HelperController {
    constructor(
        private readonly helperService: HelperService,
        private readonly uploadService: MediaService,
    ) { }

    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 10))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'List of helpers',
        type: UploadFilesDto
    })
    uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
        return this.uploadService.uploadFile(files, MediaType.HELPER);
    }

    @Post()
    addHelper(@Body() data: CreateHelperDto) {
        return this.helperService.addHelper(data);
    }

    @Patch(':id')
    updateHelper(@Param('id', ParseIntPipe) id: number, @Body() data: CreateHelperDto) {
        return this.helperService.updateHelper(id, data);
    }
}
