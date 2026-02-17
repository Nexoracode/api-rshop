import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    UseInterceptors,
    UploadedFiles,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { GiftWrappingService } from './gift-wrapping.service';
import { CreateGiftWrappingDto } from './dto/create-gift-wrapping.dto';
import { UpdateGiftWrappingDto } from './dto/update-gift-wrapping.dto';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Role } from 'src/common/enums/role.enum';
import { ApiPaginationQuery, FilterOperator, Paginate, PaginateQuery, PaginationType } from 'nestjs-paginate';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from '../media/media.service';
import { MediaType } from 'src/common/enums/media.enum';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { UploadFilesDto } from '../media/dto/upload-file.dto';

@ApiTags('20 - 🎁 Gift Wrapping (Admin)')
@Controller('admin/gift-wrappings')
@ApiBearerAuth()
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
export class GiftWrappingAdminController {
    constructor(
        private readonly giftWrappingService: GiftWrappingService,
        private readonly mediaService: MediaService,
    ) { }

    /**
     * آپلود تصویر بسته‌بندی
     */
    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 2))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'List of Gift Wrapping Images',
        type: UploadFilesDto
    })
    async uploadImage(@UploadedFiles() files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException('فایلی برای آپلود انتخاب نشده است');
        }

        const result = await this.mediaService.uploadFile(
            files,
            MediaType.GIFT_WRAPPING
        );

        return {
            success: true,
            message: 'تصویر بسته‌بندی با موفقیت آپلود شد',
            data: result.data[0],
        };
    }

    /**
     * ایجاد بسته‌بندی جدید
     */
    @Post()
    @ApiOperation({
        summary: 'ایجاد بسته‌بندی جدید',
        description: 'ایجاد بسته‌بندی کادو جدید توسط ادمین',
    })
    @ApiResponse({
        status: 201,
        description: 'بسته‌بندی با موفقیت ایجاد شد',
    })
    async create(@Body() createDto: CreateGiftWrappingDto) {
        const giftWrapping = await this.giftWrappingService.create(createDto);
        return {
            success: true,
            message: 'بسته‌بندی با موفقیت ایجاد شد',
            data: giftWrapping,
        };
    }

    /**
     * دریافت تمام بسته‌بندی‌ها با Pagination
     */
    @Get()
    @ApiOperation({
        summary: 'دریافت لیست تمام بسته‌بندی‌ها',
        description: `
        دریافت لیست بسته‌بندی‌های کادو با قابلیت جستجو، فیلتر و صفحه‌بندی
        
**انواع isActive:**
- \`true\`: فعال
- \`false\`: غیرفعال

**انواع isForGift:**
- \`true\`: برای هدیه
- \`false\`: برای غیرهدیه
        `,
    })
    @ApiResponse({
        status: 200,
        description: 'لیست بسته‌بندی‌ها با موفقیت دریافت شد',
    })
    @ApiPaginationQuery({
        paginationType: PaginationType.CURSOR,
        sortableColumns: ['id', 'name', 'price', 'displayOrder', 'createdAt'],
        defaultSortBy: [['displayOrder', 'ASC']],
        searchableColumns: ['name', 'description'],
        filterableColumns: {
            isActive: [FilterOperator.EQ],
            isForGift: [FilterOperator.EQ],
        },
    })
    async findAll(@Paginate() query: PaginateQuery) {
        const result = await this.giftWrappingService.findAll(query);
        return {
            success: true,
            message: 'لیست بسته‌بندی‌ها با موفقیت دریافت شد',
            data: result,
        };
    }

    /**
     * دریافت جزئیات یک بسته‌بندی
     */
    @Get(':id')
    @ApiOperation({
        summary: 'دریافت جزئیات بسته‌بندی',
        description: 'دریافت اطلاعات کامل یک بسته‌بندی',
    })
    @ApiResponse({
        status: 200,
        description: 'جزئیات بسته‌بندی با موفقیت دریافت شد',
    })
    @ApiResponse({
        status: 404,
        description: 'بسته‌بندی یافت نشد',
    })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const giftWrapping = await this.giftWrappingService.findOne(id);
        return {
            success: true,
            message: 'جزئیات بسته‌بندی با موفقیت دریافت شد',
            data: giftWrapping,
        };
    }

    /**
     * بروزرسانی بسته‌بندی
     */
    @Patch(':id')
    @ApiOperation({
        summary: 'بروزرسانی بسته‌بندی',
        description: 'بروزرسانی اطلاعات یک بسته‌بندی',
    })
    @ApiResponse({
        status: 200,
        description: 'بسته‌بندی با موفقیت بروزرسانی شد',
    })
    @ApiResponse({
        status: 404,
        description: 'بسته‌بندی یافت نشد',
    })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateGiftWrappingDto,
    ) {
        const giftWrapping = await this.giftWrappingService.update(id, updateDto);
        return {
            success: true,
            message: 'بسته‌بندی با موفقیت بروزرسانی شد',
            data: giftWrapping,
        };
    }

    /**
     * تغییر وضعیت بسته‌بندی
     */
    @Patch(':id/toggle-status')
    @ApiOperation({
        summary: 'تغییر وضعیت بسته‌بندی',
        description: 'فعال یا غیرفعال کردن بسته‌بندی',
    })
    @ApiResponse({
        status: 200,
        description: 'وضعیت بسته‌بندی با موفقیت تغییر کرد',
    })
    async toggleStatus(@Param('id', ParseIntPipe) id: number) {
        const giftWrapping = await this.giftWrappingService.toggleStatus(id);
        return {
            success: true,
            message: 'وضعیت بسته‌بندی با موفقیت تغییر کرد',
            data: giftWrapping,
        };
    }

    /**
     * حذف بسته‌بندی
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'حذف بسته‌بندی',
        description: 'حذف یک بسته‌بندی از سیستم',
    })
    @ApiResponse({
        status: 200,
        description: 'بسته‌بندی با موفقیت حذف شد',
    })
    @ApiResponse({
        status: 404,
        description: 'بسته‌بندی یافت نشد',
    })
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.giftWrappingService.remove(id);
        return {
            success: true,
            message: 'بسته‌بندی با موفقیت حذف شد',
        };
    }
}
