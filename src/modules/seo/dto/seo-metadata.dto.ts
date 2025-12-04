import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class SeoMetadataDto {
  @ApiProperty({ 
    description: 'عنوان صفحه برای SEO', 
    example: 'گوشی موبایل سامسونگ | فروشگاه آنلاین',
    maxLength: 60
  })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  title?: string;

  @ApiProperty({ 
    description: 'توضیحات متا برای SEO', 
    example: 'خرید گوشی موبایل سامسونگ با بهترین قیمت و گارانتی معتبر',
    maxLength: 160
  })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  description?: string;

  @ApiProperty({ 
    description: 'کلمات کلیدی', 
    example: 'گوشی سامسونگ, خرید موبایل, قیمت گوشی',
    required: false
  })
  @IsString()
  @IsOptional()
  keywords?: string;

  @ApiProperty({ 
    description: 'عنوان Open Graph', 
    required: false
  })
  @IsString()
  @IsOptional()
  ogTitle?: string;

  @ApiProperty({ 
    description: 'توضیحات Open Graph', 
    required: false
  })
  @IsString()
  @IsOptional()
  ogDescription?: string;

  @ApiProperty({ 
    description: 'تصویر Open Graph', 
    example: 'https://example.com/images/product.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  ogImage?: string;

  @ApiProperty({ 
    description: 'URL کانونیکال', 
    example: 'https://example.com/product/samsung-galaxy-s24',
    required: false
  })
  @IsString()
  @IsOptional()
  canonical?: string;

  @ApiProperty({ 
    description: 'عدم ایندکس شدن در موتورهای جستجو', 
    default: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  noindex?: boolean;

  @ApiProperty({ 
    description: 'عدم دنبال کردن لینک‌ها', 
    default: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  nofollow?: boolean;
}

export class ProductSeoDto extends SeoMetadataDto {
  @ApiProperty({ 
    description: 'داده ساختاریافته Schema.org',
    required: false
  })
  @IsOptional()
  structuredData?: any;
}
