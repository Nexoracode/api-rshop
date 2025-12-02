import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { SmsProvider } from '../../domain/interfaces/sms-provider.interface';
import promotionConfig from '../../config/promotion.config';

@Injectable()
export class IppanelSmsProvider extends SmsProvider {
    private readonly logger = new Logger(IppanelSmsProvider.name);
    private readonly baseUrl = 'https://api.ippanel.com/v1/messages';

    constructor(
        @Inject(promotionConfig.KEY)
        private readonly config: ConfigType<typeof promotionConfig>,
    ) {
        super();
    }

    async send(recipients: string[], message: string): Promise<void> {
        if (!recipients.length) {
            this.logger.warn('No recipients provided for SMS');
            return;
        }

        const apiKey = this.config.sms.apiKey;
        const fromNumber = this.config.sms.fromNumber;

        if (!apiKey) {
            this.logger.error('SMS API key not configured');
            throw new Error('SMS API key not configured');
        }

        try {
            this.logger.log(
                `Sending SMS to ${recipients.length} recipient(s) via ${this.config.sms.provider}`,
            );

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
                        apikey: apiKey,
                    },
                },
            );

            this.logger.log(`SMS sent successfully to ${recipients.length} recipient(s)`);
        } catch (error) {
            this.logger.error(
                `Failed to send SMS: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }
}
