import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFiles, UseInterceptors, UseGuards } from '@nestjs/common';
import { HelperService } from './helper.service';
import { CreateHelperDto } from './dto/create-helper.dto';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadFilesDto } from '../media/dto/upload-file.dto';
import { MediaType } from 'src/common/enums/media.enum';
import { UploadService } from 'src/common/services/upload.service';
import { MediaService } from '../media/media.service';
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery, PaginationType } from 'nestjs-paginate';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('11 - 🆘 Helpers')
@Controller('helpers')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
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

    @Get()
    @ApiPaginationQuery({
        paginationType: PaginationType.CURSOR,
        sortableColumns: ['id'],
        relations: ['product'],
        filterableColumns: {
            id: [FilterOperator.EQ],
            'product.id': [FilterOperator.EQ]
        },
        defaultSortBy: [['id', 'DESC']],
        searchableColumns: ['id', 'title'],
    })
    async findAll(@Paginate() query: PaginateQuery) {
        return this.helperService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.helperService.findOne(id);
    }

    @Post()
    addHelper(@Body() data: CreateHelperDto) {
        return this.helperService.addHelper(data);
    }

    @Patch(':id')
    updateHelper(@Param('id', ParseIntPipe) id: number, @Body() data: CreateHelperDto) {
        return this.helperService.updateHelper(id, data);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.helperService.remove(id);
    }
}
