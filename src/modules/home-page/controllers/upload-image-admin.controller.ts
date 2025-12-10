import { Controller, Post, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/common/decorator/role.decorator";
import { MediaType } from "src/common/enums/media.enum";
import { Role } from "src/common/enums/role.enum";
import { AccessGuard } from "src/common/guard/access.guard";
import { RoleGuard } from "src/common/guard/role.guard";
import { UploadFilesDto } from "src/modules/media/dto/upload-file.dto";
import { MediaService } from "src/modules/media/media.service";

@Controller('admin/upload-slider-images')
@ApiTags('Admin - Upload Slider Images')
@UseGuards(AccessGuard, RoleGuard)
export class UploadImageAdminController {
    constructor(
        private readonly uploadService: MediaService
    ) { }

    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 10))
    @ApiConsumes('multipart/form-data')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @ApiBody({
        description: 'Upload Slider Images',
        type: UploadFilesDto
    })
    uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
        return this.uploadService.uploadFile(files, MediaType.HOME);
    }
}