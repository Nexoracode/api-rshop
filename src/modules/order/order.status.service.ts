import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from "typeorm";
import { OrderStatus } from "./enums/order-status.enum";
import { Order } from "./entities/order.entity";
import { OrderCacheService } from "./cache/order-cache.service";
import { User } from "../user/entities/user.entity";
import { SmsService } from "../otps/sms.service";
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OrderStatusService {
    private readonly logger = new Logger(OrderStatusService.name);
    private readonly frontendUrl: string;

    constructor(
        private readonly orderCacheService: OrderCacheService,
        private readonly smsService: SmsService,
        private readonly configService: ConfigService,
    ) {
        this.frontendUrl = this.configService.get('FRONTEND_URL', 'https://rshop.roohbakhshac.ir');
    }

    async updateOrderStatus(order: Order, status: OrderStatus, manager: EntityManager) {
        const orderRepo = manager.getRepository(Order);
        order.status = status;
        const user: User = order.user;
        console.log('Clearing order cache for user:', user.id);
        await this.orderCacheService.clearUserOrderCache(user.id);
        await orderRepo.save(order);

        // ✅ اگر وضعیت شد AWAITING_PAYMENT، پیامک بفرست
        // if (status === OrderStatus.AWAITING_PAYMENT) {
        //     this.sendPaymentReminderSms(order).catch(err =>
        //         this.logger.error(`خطا در ارسال پیامک: ${err.message}`)
        //     );
        // }
    }

    /**
     * ارسال پیامک یادآوری پرداخت با لینک کوتاه
     */
    private async sendPaymentReminderSms(order: Order): Promise<void> {
        try {
            // لینک صفحه سفارش
            const orderLink = `${this.frontendUrl}/orders/${order.id}`;
            // کوتاه کردن لینک (اختیاری)
            const shortLink = await this.shortenUrl(orderLink);
            console.log(shortLink);
            // ارسال پیامک با pattern
            const patternCode = this.configService.get('SMS_PAYMENT_REMINDER_PATTERN', 'payment_reminder');

            // await this.smsService.sendPatternSms(
            //     order.user.phone,
            //     patternCode,
            //     {
            //         'order_id': order.id.toString(),
            //         'link': shortLink,
            //     }
            // );

            this.logger.log(`✅ پیامک یادآوری برای سفارش ${order.id} ارسال شد`);
        } catch (error) {
            this.logger.error(`❌ خطا در ارسال پیامک برای سفارش ${order.id}: ${error.message}`);
        }
    }

    /**
     * کوتاه کردن URL (ساده و سریع)
     */
    private async shortenUrl(longUrl: string): Promise<string> {
        try {
            const response = await axios.get('https://is.gd/create.php', {
                params: { format: 'json', url: longUrl },
                timeout: 3000,
            });
            console.log(response.data);
            return response.data.shorturl || longUrl;
        } catch (error) {
            console.error('Error shortening URL:', error);
            // اگر خطا داد، همون لینک اصلی رو برمی‌گردونیم
            return longUrl;
        }
    }
}
