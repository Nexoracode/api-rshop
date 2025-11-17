import { Injectable } from '@nestjs/common';
import { SmsProvider } from '../interfaces/sms-provider.interface';

@Injectable()
export class SmsSenderService {
    constructor(private readonly smsProvider: SmsProvider) { }

    async sendPromotionSms(recipients: string[], message: string) {
        if (!recipients.length) return;
        await this.smsProvider.send(recipients, message);
    }
}