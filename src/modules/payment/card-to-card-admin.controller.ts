import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CardToCardService } from './card-to-card.service';
import { ReviewReceiptDto } from './dto/card-to-card/review-receipt.dto';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Role } from 'src/common/enums/role.enum';
import { User } from '../user/entities/user.entity';
import { CardToCardStatus } from './enums/payment-status.enum';
import { Roles } from 'src/common/decorator/role.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';

@ApiTags('21 - 💳 Card to Card (Admin)')
@Controller('admin/card-to-card')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SUPER_ADMIN)
export class CardToCardAdminController {
    constructor(
        private readonly cardToCardService: CardToCardService,
    ) { }

    /**
     * لیست تمام پرداخت‌های کارت به کارت
     */
    @Get()
    @ApiOperation({
        summary: 'لیست پرداخت‌های کارت به کارت',
        description: 'دریافت تمام پرداخت‌های کارت به کارت با امکان فیلتر بر اساس وضعیت',
    })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: CardToCardStatus,
        description: 'فیلتر بر اساس وضعیت',
    })
    @ApiResponse({
        status: 200,
        description: 'لیست پرداخت‌ها',
    })
    async getAllPayments(
        @Query('status') status?: CardToCardStatus,
    ) {
        const payments = await this.cardToCardService.findAllForAdmin(status);

        return {
            success: true,
            message: 'لیست پرداخت‌های کارت به کارت',
            data: payments,
        };
    }

    /**
     * جزئیات یک پرداخت
     */
    @Get(':payment_id')
    @ApiOperation({
        summary: 'جزئیات پرداخت',
        description: 'دریافت اطلاعات کامل یک پرداخت کارت به کارت',
    })
    @ApiResponse({
        status: 200,
        description: 'جزئیات پرداخت',
    })
    async getPaymentDetails(
        @Param('payment_id', ParseIntPipe) paymentId: number,
    ) {
        const payment = await this.cardToCardService.findOne(paymentId);

        return {
            success: true,
            message: 'جزئیات پرداخت',
            data: payment,
        };
    }

    /**
     * تایید یا رد رسید
     */
    @Post(':payment_id/review')
    @ApiOperation({
        summary: 'بررسی و تایید/رد رسید',
        description: 'تایید یا رد رسید واریز توسط ادمین',
    })
    @ApiResponse({
        status: 200,
        description: 'رسید بررسی شد',
    })
    async reviewReceipt(
        @CurrentUser() admin: User,
        @Param('payment_id', ParseIntPipe) paymentId: number,
        @Body() dto: ReviewReceiptDto,
    ) {
        const payment = await this.cardToCardService.reviewReceipt(
            admin,
            paymentId,
            dto,
        );

        return {
            success: true,
            message: dto.status === CardToCardStatus.APPROVED
                ? 'رسید تایید شد و سفارش نهایی شد'
                : 'رسید رد شد',
            data: {
                payment_id: payment.id,
                status: payment.cardToCardStatus,
                admin_note: payment.adminNote,
                reviewed_at: payment.reviewedAt,
            },
        };
    }

    /**
     * لیست رسیدهای منتظر تایید
     */
    @Get('pending/list')
    @ApiOperation({
        summary: 'لیست رسیدهای منتظر تایید',
        description: 'دریافت پرداخت‌هایی که رسید آپلود شده اما هنوز تایید نشده‌اند',
    })
    @ApiResponse({
        status: 200,
        description: 'لیست رسیدهای منتظر',
    })
    async getPendingReceipts() {
        const payments = await this.cardToCardService.findAllForAdmin(
            CardToCardStatus.UPLOADED,
        );

        return {
            success: true,
            message: 'لیست رسیدهای منتظر تایید',
            data: payments,
            count: payments.length,
        };
    }
}
