import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    UseInterceptors,
    UploadedFiles,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { CardToCardService } from './card-to-card.service';
import { InitiateCardToCardDto } from './dto/card-to-card/initiate-card-to-card.dto';
import { UploadReceiptDto } from './dto/card-to-card/upload-receipt.dto';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { User } from '../user/entities/user.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from '../media/media.service';
import { MediaType } from 'src/common/enums/media.enum';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { AccessGuard } from 'src/common/guard/access.guard';
import { SettingService } from '../setting/setting.service';

@ApiTags('21 - 💳 Card to Card Payment (User)')
@ApiBearerAuth()
@Controller('card-to-card')
@UseGuards(AccessGuard)
export class CardToCardController {
    constructor(
        private readonly cardToCardService: CardToCardService,
        private readonly mediaService: MediaService,
        private readonly settingService: SettingService, // ✅ اضافه شد
    ) { }

    /**
     * دریافت اطلاعات کارت فروشگاه
     */
    @Get('shop-card-info')
    @ApiOperation({
        summary: 'دریافت اطلاعات کارت فروشگاه',
        description: 'اطلاعات لازم برای واریز کارت به کارت',
    })
    @ApiResponse({
        status: 200,
        description: 'اطلاعات کارت فروشگاه',
    })
    async getShopCardInfo() {
        const cardInfo = await this.settingService.getCardToCardSettings();

        return {
            success: true,
            message: 'اطلاعات کارت فروشگاه',
            data: cardInfo,
        };
    }

    /**
     * ایجاد پرداخت کارت به کارت
     */
    @Post('initiate')
    @ApiOperation({
        summary: 'ایجاد پرداخت کارت به کارت',
        description: 'شروع فرآیند پرداخت کارت به کارت برای یک سفارش',
    })
    @ApiResponse({
        status: 201,
        description: 'پرداخت ایجاد شد، منتظر آپلود رسید',
    })
    async initiate(
        @CurrentUser() user: User,
        @Body() dto: InitiateCardToCardDto,
    ) {
        const payment = await this.cardToCardService.initiate(user, dto);

        // ✅ دریافت اطلاعات کارت از تنظیمات
        const cardInfo = await this.settingService.getCardToCardSettings();

        return {
            success: true,
            message: 'پرداخت کارت به کارت ایجاد شد. لطفاً رسید خود را آپلود کنید',
            data: {
                payment_id: payment.id,
                order_id: payment.order.id,
                amount: payment.amount,
                status: payment.cardToCardStatus,
                // ✅ اطلاعات حساب فروشگاه از تنظیمات
                shop_card_info: cardInfo,
            },
        };
    }

    /**
     * آپلود رسید (با تصویر یا اطلاعات دستی)
     */
    @Post(':payment_id/upload-receipt')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'آپلود رسید واریز',
        description: `آپلود رسید واریز برای پرداخت کارت به کارت.
        
        دو حالت دارد:
        1. آپلود تصویر رسید: فقط عکس رو آپلود کنید
        2. وارد کردن دستی: شماره کارت + شماره پیگیری (بدون عکس)
        
        توجه: حداقل یکی از دو حالت بالا الزامی است`,
    })
    @ApiResponse({
        status: 200,
        description: 'رسید با موفقیت ثبت شد',
    })
    @UseInterceptors(FilesInterceptor('files', 1))
    @ApiBody({ type: UploadReceiptDto, description: 'فیلدهای مورد نیاز برای آپلود رسید' })
    async uploadReceipt(
        @CurrentUser() user: User,
        @Param('payment_id', ParseIntPipe) paymentId: number,
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: UploadReceiptDto,
    ) {
        const hasImage = files && files.length > 0;
        const hasManualData = dto.sender_card_number && dto.tracking_code;

        // بررسی: حداقل یکی از دو حالت باید وجود داشته باشه
        if (!hasImage && !hasManualData) {
            throw new BadRequestException(
                'لطفاً یا تصویر رسید را آپلود کنید یا اطلاعات دستی (شماره کارت + شماره پیگیری) را وارد کنید'
            );
        }

        let receiptImageId: number | undefined;

        // اگر تصویر آپلود شده
        if (hasImage) {
            const uploadResult = await this.mediaService.uploadFile(
                files,
                MediaType.PAYMENT_RECEIPT,
            );
            receiptImageId = uploadResult.data[0].id;
            dto.has_receipt_image = true;
        }

        // بروزرسانی پرداخت
        const payment = await this.cardToCardService.uploadReceipt(
            user,
            paymentId,
            receiptImageId,
            dto,
        );

        if (!payment) {
            throw new BadRequestException('خطا در ثبت رسید پرداخت');
        }

        return {
            success: true,
            message: hasImage
                ? 'رسید با موفقیت آپلود شد. پرداخت شما در حال بررسی است'
                : 'اطلاعات واریز با موفقیت ثبت شد. پرداخت شما در حال بررسی است',
            data: {
                payment_id: payment.id,
                status: payment.cardToCardStatus,
                has_image: !!payment.receiptImage,
                has_manual_data: !!(payment.senderCardNumber && payment.trackingCode),
            },
        };
    }

    /**
     * دریافت پرداخت‌های کاربر
     */
    @Get('my-payments')
    @ApiOperation({
        summary: 'لیست پرداخت‌های کارت به کارت کاربر',
        description: 'دریافت تمام پرداخت‌های کارت به کارت کاربر',
    })
    @ApiResponse({
        status: 200,
        description: 'لیست پرداخت‌ها با موفقیت دریافت شد',
    })
    async getMyPayments(@CurrentUser() user: User) {
        const payments = await this.cardToCardService.findAllByUser(user);

        return {
            success: true,
            message: 'لیست پرداخت‌های شما',
            data: payments,
        };
    }

    /**
     * جزئیات یک پرداخت
     */
    @Get(':payment_id')
    @ApiOperation({
        summary: 'جزئیات پرداخت کارت به کارت',
        description: 'دریافت اطلاعات کامل یک پرداخت',
    })
    @ApiResponse({
        status: 200,
        description: 'جزئیات پرداخت',
    })
    async getPaymentDetails(
        @CurrentUser() user: User,
        @Param('payment_id', ParseIntPipe) paymentId: number,
    ) {
        const payment = await this.cardToCardService.findOne(paymentId, user);

        return {
            success: true,
            message: 'جزئیات پرداخت',
            data: payment,
        };
    }
}
