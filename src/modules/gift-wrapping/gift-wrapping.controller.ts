import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { GiftWrappingService } from './gift-wrapping.service';
import { CreateGiftWrappingDto } from './dto/create-gift-wrapping.dto';
import { UpdateGiftWrappingDto } from './dto/update-gift-wrapping.dto';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Role } from 'src/common/enums/role.enum';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { Public } from 'src/common/decorator/public.decorator';
import { Roles } from 'src/common/decorator/role.decorator';

@ApiTags('20 - 🎁 Gift Wrapping (Packaging)')
@Controller('gift-wrappings')
export class GiftWrappingController {
    constructor(private readonly giftWrappingService: GiftWrappingService) { }

    /**
     * ایجاد بسته‌بندی جدید (ادمین)
     */
    @Post()
    @ApiBearerAuth()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({
        summary: 'ایجاد بسته‌بندی جدید',
        description: 'فقط ادمین می‌تواند بسته‌بندی جدید ایجاد کند'
    })
    @ApiResponse({ status: 201, description: 'بسته‌بندی با موفقیت ایجاد شد' })
    @ApiResponse({ status: 401, description: 'عدم احراز هویت' })
    @ApiResponse({ status: 403, description: 'عدم دسترسی' })
    async create(@Body() createDto: CreateGiftWrappingDto) {
        const giftWrapping = await this.giftWrappingService.create(createDto);
        return {
            success: true,
            message: 'بسته‌بندی با موفقیت ایجاد شد',
            data: giftWrapping,
        };
    }

    /**
     * دریافت تمام بسته‌بندی‌ها با Pagination (ادمین)
     */
    @Get('admin')
    @ApiBearerAuth()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({
        summary: 'دریافت تمام بسته‌بندی‌ها (ادمین)',
        description: 'لیست تمام بسته‌بندی‌ها شامل فعال و غیرفعال'
    })
    @ApiResponse({ status: 200, description: 'لیست بسته‌بندی‌ها' })
    async findAll(@Paginate() query: PaginateQuery) {
        const result = await this.giftWrappingService.findAll(query);
        return {
            success: true,
            message: 'لیست بسته‌بندی‌ها با موفقیت دریافت شد',
            data: result,
        };
    }

    /**
     * دریافت بسته‌بندی‌های فعال (عمومی)
     */
    @Get('active')
    @Public()
    @ApiOperation({
        summary: 'دریافت بسته‌بندی‌های فعال',
        description: 'لیست بسته‌بندی‌های فعال برای نمایش به کاربران'
    })
    @ApiResponse({ status: 200, description: 'لیست بسته‌بندی‌های فعال' })
    async findAllActive() {
        const giftWrappings = await this.giftWrappingService.findAllActive();
        return {
            success: true,
            message: 'لیست بسته‌بندی‌های فعال با موفقیت دریافت شد',
            data: giftWrappings,
        };
    }

    /**
     * دریافت یک بسته‌بندی (عمومی)
     */
    @Get(':id')
    @Public()
    @ApiOperation({
        summary: 'دریافت جزئیات یک بسته‌بندی',
        description: 'دریافت اطلاعات کامل یک بسته‌بندی'
    })
    @ApiResponse({ status: 200, description: 'جزئیات بسته‌بندی' })
    @ApiResponse({ status: 404, description: 'بسته‌بندی یافت نشد' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const giftWrapping = await this.giftWrappingService.findOne(id);
        return {
            success: true,
            message: 'جزئیات بسته‌بندی با موفقیت دریافت شد',
            data: giftWrapping,
        };
    }

    /**
     * بروزرسانی بسته‌بندی (ادمین)
     */
    @Patch(':id')
    @ApiBearerAuth()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({
        summary: 'بروزرسانی بسته‌بندی',
        description: 'فقط ادمین می‌تواند بسته‌بندی را بروزرسانی کند'
    })
    @ApiResponse({ status: 200, description: 'بسته‌بندی با موفقیت بروزرسانی شد' })
    @ApiResponse({ status: 404, description: 'بسته‌بندی یافت نشد' })
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
     * تغییر وضعیت بسته‌بندی (ادمین)
     */
    @Patch(':id/toggle-status')
    @ApiBearerAuth()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({
        summary: 'تغییر وضعیت بسته‌بندی',
        description: 'فعال/غیرفعال کردن بسته‌بندی'
    })
    @ApiResponse({ status: 200, description: 'وضعیت بسته‌بندی با موفقیت تغییر کرد' })
    async toggleStatus(@Param('id', ParseIntPipe) id: number) {
        const giftWrapping = await this.giftWrappingService.toggleStatus(id);
        return {
            success: true,
            message: 'وضعیت بسته‌بندی با موفقیت تغییر کرد',
            data: giftWrapping,
        };
    }

    /**
     * حذف بسته‌بندی (ادمین)
     */
    @Delete(':id')
    @ApiBearerAuth()
    @Roles(Role.ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({
        summary: 'حذف بسته‌بندی',
        description: 'فقط ادمین می‌تواند بسته‌بندی را حذف کند'
    })
    @ApiResponse({ status: 200, description: 'بسته‌بندی با موفقیت حذف شد' })
    @ApiResponse({ status: 404, description: 'بسته‌بندی یافت نشد' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.giftWrappingService.remove(id);
        return {
            success: true,
            message: 'بسته‌بندی با موفقیت حذف شد',
        };
    }
}
