import { Body, Controller, Post } from '@nestjs/common';
import { CheckPromotionUseCase } from '../../application/usecases/check-promotion.usecase';
import { CheckPromotionDto } from '../../application/dtos/check-promotion.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionController {
    constructor(private readonly checkPromotionUseCase: CheckPromotionUseCase) { }

    @Post('check')
    @ApiOperation({ summary: 'Check promotion for order' })
    @ApiBody({ type: CheckPromotionDto })
    @ApiResponse({ status: 200, description: 'Promotion applied successfully' })
    @ApiResponse({ status: 404, description: 'Promotion not found' })
    async check(@Body() dto: CheckPromotionDto) {
        const payload = { ...dto, isFirstOrder: dto.isFirstOrder ?? false };
        return this.checkPromotionUseCase.execute(payload);
    }
}
