import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SmsProvider } from '../../domain/interfaces/sms-provider.interface';

@Injectable()
export class IppanelSmsProvider extends SmsProvider {
    private readonly baseUrl = 'https://api.ippanel.com/v1/messages';

    async send(recipients: string[], message: string): Promise<void> {
        if (!recipients.length) return;

        // TODO: تو env بزار
        const apiKey = process.env.IPPANEL_API_KEY;
        const fromNumber = process.env.IPPANEL_FROM_NUMBER || '+983000505';

        await axios.post(
            this.baseUrl,
            {
                sending_type: 'webservice',
                from_number: fromNumber,
                message,
                params: {
                    recipients,
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey,
                },
            },
        );
    }
}