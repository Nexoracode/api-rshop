# 🔧 تنظیمات Environment Variables

## 📋 فایل‌های Environment

پروژه از سه فایل environment استفاده می‌کند:

- `.env.development` - برای محیط توسعه
- `.env.production` - برای محیط production
- `.env.example` - نمونه template

## 🚀 راه‌اندازی سریع

### Development
```bash
# اجرا در حالت development
npm run start:dev
```

### Production
```bash
# اجرا در حالت production
NODE_ENV=production npm run start:prod
```

## 🔍 تفاوت‌های Development و Production

| ویژگی | Development | Production |
|------|------------|-----------|
| **Rate Limiting** | ❌ غیرفعال | ✅ فعال (100 req/min) |
| **Redis Password** | ❌ بدون پسورد | ✅ با پسورد |
| **JWT Expiration** | 7 روز | 15 دقیقه |
| **Cache TTL** | 300 ثانیه | 300 ثانیه |
| **Logging** | مفصل | خلاصه (warn) |
| **Zarinpal** | Sandbox | Production |

## 🔐 تنظیمات امنیتی مهم

### JWT Secrets
⚠️ **هرگز از secrets پیش‌فرض در production استفاده نکنید!**

```bash
# تولید secret قوی با Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Redis Password
```bash
# تولید password قوی
openssl rand -base64 32
```

## 💾 تنظیمات Redis

### Development (Local)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
# بدون password
```

### Production (CapRover)
```env
REDIS_HOST=srv-captain--redis-rshop
REDIS_PORT=6379
REDIS_PASSWORD=your_strong_password
REDIS_TLS=false
```

### Production (External - Upstash)
```env
REDIS_HOST=your-region.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your_upstash_password
REDIS_TLS=true
```

## 🚦 Rate Limiting

### غیرفعال در Development
Rate limiting به صورت خودکار در development غیرفعال است.

### فعال در Production
```env
THROTTLE_TTL=60000        # 60 ثانیه
THROTTLE_LIMIT=100        # 100 درخواست
```

برای تغییر محدودیت:
- `THROTTLE_TTL`: بازه زمانی (میلی‌ثانیه)
- `THROTTLE_LIMIT`: تعداد درخواست مجاز

## 📱 SMS Provider

دو provider پشتیبانی می‌شود:

### Faraz SMS
```env
FARAZ_SMS_API_KEY=your_key
FARAZ_SMS_ORIGINATOR=+983000505
```

### IPPanel
```env
SMS_PROVIDER=ippanel
IPPANEL_API_KEY=your_key
IPPANEL_FROM_NUMBER=+983000505
```

## 💳 Zarinpal

### Development (Sandbox)
```env
ZARINPAL_MERCHANT_ID=your_test_merchant_id
ZARINPAL_SANDBOX=true
```

### Production
```env
ZARINPAL_MERCHANT_ID=your_production_merchant_id
ZARINPAL_SANDBOX=false
```

## 🔍 Checklist قبل از Deploy

- [ ] تغییر تمام passwords و secrets
- [ ] تنظیم `NODE_ENV=production`
- [ ] فعال بودن `ZARINPAL_SANDBOX=false`
- [ ] تنظیم صحیح `REDIS_HOST` و `REDIS_PASSWORD`
- [ ] تنظیم `FRONTEND_URL` و `ALLOWED_ORIGINS`
- [ ] تنظیم `DB_HOST` و credentials دیتابیس
- [ ] بررسی تنظیمات FTP
- [ ] تست اتصال Redis با `/health/redis`
- [ ] بررسی لاگ‌ها هنگام startup

## 📊 Health Checks

بعد از deploy، این endpoint ها را تست کنید:

```bash
# Health check کلی
curl https://api.your-domain.com/api/v1/health

# تست Redis
curl https://api.your-domain.com/api/v1/health/redis
```

## 🆘 مشکلات رایج

### Redis Connection Failed
```bash
# چک کنید Redis در حال اجراست
# چک کنید hostname صحیح است
# چک کنید password صحیح است
```

### Rate Limiting خیلی محدود کننده است
```env
# افزایش limit
THROTTLE_LIMIT=200
```

### JWT Token Expired خیلی زود
```env
# افزایش expiration (فقط development)
JWT_EXPIRATION=24h
```

## 📞 پشتیبانی

در صورت مشکل در تنظیمات، به مستندات زیر مراجعه کنید:
- [NestJS Config](https://docs.nestjs.com/techniques/configuration)
- [Redis Cache](https://docs.nestjs.com/techniques/caching)
- [Rate Limiting](https://docs.nestjs.com/security/rate-limiting)
