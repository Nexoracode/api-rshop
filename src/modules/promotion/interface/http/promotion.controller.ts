import { Body, Controller, Logger, Post } from '@nestjs/common';
import { CheckPromotionUseCase } from '../../application/usecases/check-promotion.usecase';
import { CheckPromotionDto } from '../../application/dtos/check-promotion.dto';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiBadRequestResponse
} from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('18 - 🎁 Promotions (Public)')
@Controller('promotions')
export class PromotionController {
    private readonly logger = new Logger(PromotionController.name);

    constructor(private readonly checkPromotionUseCase: CheckPromotionUseCase) { }

    @Post('check')
    @Public()
    @ApiOperation({ summary: 'بررسی و محاسبه تخفیف‌های قابل اعمال' })
    async check(@Body() dto: CheckPromotionDto) {
        // ─── DEBUG LOG ────────────────────────────────────────────────────────
        this.logger.debug(`[CHECK] raw dto: ${JSON.stringify(dto)}`);
        this.logger.debug(`[CHECK] dto.code = "${dto.code}" | hasCode = ${!!dto.code}`);
        // ─────────────────────────────────────────────────────────────────────

        const payload = { ...dto, isFirstOrder: dto.isFirstOrder ?? false };
        const result = await this.checkPromotionUseCase.execute(payload);

        return {
            message: 'تخفیف‌ها با موفقیت محاسبه شد',
            data: result
        };
    }
}
