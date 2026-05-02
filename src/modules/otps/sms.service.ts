import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    // private readonly baseUrl = 'https://edge.ippanel.com/v1/api/send';
    private readonly baseUrl = 'https://api.iranpayamak.com/ws/v1/sms/pattern';
    private readonly apiKey = process.env.FARAZ_SMS_API_KEY; // کلید API فراز اس‌ام‌اس
    private readonly fromNumber = process.env.FARAZ_SMS_ORIGINATOR; // مثال: +983000505


    async sendOtp(phone: string, code: string) {
        const formattedPhone = this.formatPhone(phone);
        let data = JSON.stringify({
            "code": "zBHGCbzvQO",
            "line_number": this.fromNumber,
            'number_format': 'english',
            "recipient": phone,
            "attributes": {
                "verificationcode": code,
                "name": phone
            }
        });
        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: this.baseUrl,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Api-Key': this.apiKey,
            },
            data
        };
        try {
            const response = await axios.request(config);
            this.logger.log(`✅ OTP sent to ${formattedPhone} - status: ${response.status}`);
        } catch (error: any) {
            console.log(error.response.data);
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
