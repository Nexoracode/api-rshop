import { Public } from "src/common/decorator/public.decorator";
import { PromoBannerService } from "../promo-banner.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get } from "@nestjs/common";

@ApiTags('Public - promo banner')
@Controller('home/promo-banners')
export class PromoBannerPublicController {
    constructor(
        private readonly promoBannerService: PromoBannerService
    ) { }

    @Public()
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
}