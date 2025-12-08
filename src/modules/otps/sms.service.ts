import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private readonly baseUrl = 'https://edge.ippanel.com/v1/api/send';
    private readonly apiKey = process.env.FARAZ_SMS_API_KEY; // کلید API فراز اس‌ام‌اس
    private readonly fromNumber = process.env.FARAZ_SMS_ORIGINATOR; // مثال: +983000505

    /**
     * ارسال کد OTP به شماره موبایل کاربر
     */
    async sendOtp(phone: string, code: string): Promise<void> {
        try {
            // شماره را به فرمت بین‌المللی تبدیل می‌کنیم
            const formattedPhone = this.formatPhone(phone);

            // پیام اصلی
            const message = `
کد تایید شما: ${code}
شماره همراه: ${phone}
آکادمی سید کاظم روح بخش
            `;

            // ساخت بدنه درخواست طبق داکیومنت رسمی
            const payload = {
                sending_type: 'webservice',
                from_number: this.fromNumber,
                message,
                params: {
                    recipients: [formattedPhone],
                },
                // send_time اختیاری است، در صورت نیاز می‌توان اضافه کرد
                // send_time: new Date().toISOString().replace('T', ' ').split('.')[0]
            };

            const response = await axios.post(this.baseUrl, payload, {
                headers: {
                    Authorization: this.apiKey,
                    'Content-Type': 'application/json',
                },
            });

            this.logger.log(`✅ OTP sent to ${formattedPhone} - status: ${response.status}`);
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            this.logger.error(`❌ Error sending OTP: ${msg}`);
            throw new Error('ارسال پیامک با خطا مواجه شد.');
        }
    }

    /**
     * نرمال‌سازی شماره موبایل به فرمت بین‌المللی (+98)
     */
    private formatPhone(phone: string): string {
        let p = phone.trim();
        if (p.startsWith('0')) p = '+98' + p.substring(1);
        else if (p.startsWith('98')) p = '+' + p;
        else if (!p.startsWith('+98')) p = '+98' + p;
        return p;
    }
}
