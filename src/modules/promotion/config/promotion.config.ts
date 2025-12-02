import { registerAs } from '@nestjs/config';

export default registerAs('promotion', () => ({
    cache: {
        enabled: process.env.PROMOTION_CACHE_ENABLED === 'true' || true,
        ttl: parseInt(process.env.PROMOTION_CACHE_TTL || '300', 10) || 300, // 5 minutes
    },
    sms: {
        provider: process.env.SMS_PROVIDER || 'ippanel',
        apiKey: process.env.IPPANEL_API_KEY,
        fromNumber: process.env.IPPANEL_FROM_NUMBER || '+983000505',
    },
    defaults: {
        usageLimit: parseInt(process.env.PROMOTION_DEFAULT_USAGE_LIMIT || '0', 10) || null,
        durationDays: parseInt(process.env.PROMOTION_DEFAULT_DURATION_DAYS || '30', 10) || 30,
    },
}));
