import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { CreatePromoBannerDto, UpdatePromoBannerDto } from '../dto/promo-banner.dto';
import { PromoBannerService } from '../promo-banner.service';
@ApiTags('Admin - Promo banner')
@Controller('admin/promo-banner')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class PromoBannerAdminController {
    constructor(private readonly promoBannerService: PromoBannerService) { }

    @Post()
    @ApiOperation({
        summary: 'ساخت بنر تبلیغاتی جدید',
        description: 'ایجاد یک بنر تبلیغاتی جدید برای نمایش در بالای سایت',
    })
    @ApiResponse({
        status: 201,
        description: 'بنر با موفقیت ایجاد شد',
    })
    async create(@Body() createDto: CreatePromoBannerDto) {
        const banner = await this.promoBannerService.create(createDto);

        return {
            message: 'بنر تبلیغاتی با موفقیت ایجاد شد',
            data: banner,
        };
    }

    @Get()
    @ApiOperation({
        summary: 'لیست تمام بنرهای تبلیغاتی',
        description: 'دریافت تمام بنرها شامل فعال و غیرفعال',
    })
    @ApiResponse({
        status: 200,
        description: 'لیست بنرها با موفقیت دریافت شد',
    })
    async findAll() {
        const banners = await this.promoBannerService.findAll();

        return {
            message: 'لیست بنرهای تبلیغاتی دریافت شد',
            data: banners,
        };
    }

    @Get(':id')
    @ApiOperation({
        summary: 'جزئیات یک بنر',
        description: 'دریافت اطلاعات کامل یک بنر تبلیغاتی',
    })
    @ApiParam({
        name: 'id',
        description: 'شناسه بنر',
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'جزئیات بنر دریافت شد',
    })
    @ApiResponse({
        status: 404,
        description: 'بنر یافت نشد',
    })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const banner = await this.promoBannerService.findOne(id);

        return {
            message: 'جزئیات بنر دریافت شد',
            data: banner,
        };
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'بروزرسانی بنر',
        description: 'ویرایش اطلاعات یک بنر تبلیغاتی',
    })
    @ApiParam({
        name: 'id',
        description: 'شناسه بنر',
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'بنر با موفقیت بروزرسانی شد',
    })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdatePromoBannerDto,
    ) {
        const banner = await this.promoBannerService.update(id, updateDto);

        return {
            message: 'بنر با موفقیت بروزرسانی شد',
            data: banner,
        };
    }

    @Patch(':id/toggle')
    @ApiOperation({
        summary: 'فعال/غیرفعال کردن بنر',
        description: 'تغییر وضعیت فعال بودن بنر',
    })
    @ApiParam({
        name: 'id',
        description: 'شناسه بنر',
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'وضعیت بنر تغییر کرد',
    })
    async toggleActive(@Param('id', ParseIntPipe) id: number) {
        const banner = await this.promoBannerService.toggleActive(id);

        return {
            message: `بنر ${banner.isActive ? 'فعال' : 'غیرفعال'} شد`,
            data: banner,
        };
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'حذف بنر',
        description: 'حذف کامل یک بنر تبلیغاتی',
    })
    @ApiParam({
        name: 'id',
        description: 'شناسه بنر',
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'بنر با موفقیت حذف شد',
    })
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.promoBannerService.remove(id);

        return {
            message: 'بنر تبلیغاتی با موفقیت حذف شد',
        };
    }

    @Post('cache/clear')
    @ApiOperation({
        summary: 'پاک کردن کش',
        description: 'پاک کردن تمام کش‌های مربوط به بنرهای تبلیغاتی',
    })
    @ApiResponse({
        status: 200,
        description: 'کش با موفقیت پاک شد',
    })
    async clearCache() {
        this.promoBannerService.clearCache();

        return {
            message: 'کش بنرهای تبلیغاتی با موفقیت پاک شد',
        };
    }
}