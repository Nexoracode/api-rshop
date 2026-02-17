import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { GiftWrappingService } from './gift-wrapping.service';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('20 - 🎁 Gift Wrapping (Public)')
@Controller('gift-wrappings')
export class GiftWrappingController {
    constructor(private readonly giftWrappingService: GiftWrappingService) { }

    /**
     * دریافت بسته‌بندی‌های فعال (عمومی)
     */
    @Public()
    @Get('active')
    @ApiOperation({
        summary: 'دریافت لیست بسته‌بندی‌های فعال',
        description: 'دریافت تمام بسته‌بندی‌های فعال برای نمایش به کاربران در صفحه انتخاب بسته‌بندی',
    })
    @ApiResponse({
        status: 200,
        description: 'لیست بسته‌بندی‌های فعال با موفقیت دریافت شد',
    })
    async findAllActive() {
        const giftWrappings = await this.giftWrappingService.findAllActive();
        return {
            success: true,
            message: 'لیست بسته‌بندی‌های فعال با موفقیت دریافت شد',
            data: giftWrappings,
        };
    }

    /**
     * دریافت جزئیات یک بسته‌بندی (عمومی)
     */
    @Public()
    @Get(':id')
    @ApiOperation({
        summary: 'دریافت جزئیات یک بسته‌بندی',
        description: 'دریافت اطلاعات کامل یک بسته‌بندی شامل تصویر و جزئیات',
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
}
