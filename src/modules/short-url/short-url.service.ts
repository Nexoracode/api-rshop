import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShortUrl } from './entities/short-url.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ShortUrlService {
  private readonly logger = new Logger(ShortUrlService.name);
  private readonly shortDomain: string;

  constructor(
    @InjectRepository(ShortUrl)
    private readonly repo: Repository<ShortUrl>,
    private readonly config: ConfigService,
  ) {
    // ✅ دامنه کوتاه جداگانه
    this.shortDomain = this.config.get('SHORT_URL_DOMAIN', 'rshl.link');
  }

  async shorten(url: string): Promise<string> {
    try {
      // چک کنیم قبلاً وجود داره
      const existing = await this.repo.findOne({ where: { originalUrl: url } });
      if (existing) {
        return `https://${this.shortDomain}/${existing.code}`;
      }

      // کد یکتا بساز
      const code = await this.makeUniqueCode();

      // ذخیره کن
      await this.repo.save({ code, originalUrl: url, clickCount: 0 });

      this.logger.log(`✅ لینک کوتاه شد: ${url} -> ${this.shortDomain}/${code}`);
      return `https://${this.shortDomain}/${code}`;
    } catch (error) {
      this.logger.error(`خطا در کوتاه کردن لینک: ${error.message}`);
      return url; // در صورت خطا، لینک اصلی رو برگردون
    }
  }

  async resolve(code: string): Promise<string | null> {
    try {
      const item = await this.repo.findOne({ where: { code } });
      if (!item) return null;

      // آپدیت تعداد کلیک (بدون await برای سرعت)
      this.repo.increment({ id: item.id }, 'clickCount', 1);

      return item.originalUrl;
    } catch (error) {
      return null;
    }
  }

  private async makeUniqueCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = this.randomCode();
      const exists = await this.repo.findOne({ where: { code } });
      if (!exists) return code;
    }
    return this.randomCode() + Date.now().toString(36).slice(-2);
  }

  private randomCode(): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 8; i++) { // ✅ 8 کاراکتری مثل dure0229
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}
