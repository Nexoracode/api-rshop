import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { SEO_CONFIG } from './seo.config';

@Injectable()
export class SeoService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

  async generateSitemap(): Promise<string> {
    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';

    // دریافت محصولات فعال
    const products = await this.productRepository.find({
      where: { isActive: true },
      select: ['id', 'name', 'updatedAt'],
      order: { updatedAt: 'DESC' },
      take: 50000, // محدودیت sitemap
    });

    // دریافت دسته‌بندی‌ها
    const categories = await this.categoryRepository.find({
      select: ['id', 'slug', 'updatedAt'],
      order: { updatedAt: 'DESC' },
    });

    const urls: string[] = [];

    // صفحه اصلی
    urls.push(
      this.createUrlEntry(
        baseUrl,
        new Date(),
        SEO_CONFIG.sitemap.changefreq.homepage,
        SEO_CONFIG.sitemap.priority.homepage
      )
    );

    // صفحات دسته‌بندی
    categories.forEach(category => {
      urls.push(
        this.createUrlEntry(
          `${baseUrl}/category/${category.slug}`,
          category.updatedAt,
          SEO_CONFIG.sitemap.changefreq.categories,
          SEO_CONFIG.sitemap.priority.categories
        )
      );
    });

    // صفحات محصولات
    products.forEach(product => {
      urls.push(
        this.createUrlEntry(
          `${baseUrl}/product/${product.name}`,
          product.updatedAt,
          SEO_CONFIG.sitemap.changefreq.products,
          SEO_CONFIG.sitemap.priority.products
        )
      );
    });

    // صفحات استاتیک
    SEO_CONFIG.staticPages.forEach(page => {
      urls.push(
        this.createUrlEntry(
          `${baseUrl}${page.url}`,
          new Date(),
          page.changefreq,
          page.priority
        )
      );
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;
  }

  private createUrlEntry(
    url: string,
    lastmod: Date,
    changefreq: string,
    priority: string
  ): string {
    return `  <url>
    <loc>${this.escapeXml(url)}</loc>
    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // متادیتا برای محصولات
  generateProductMeta(product: any) {
    const title = product.metaTitle ||
      this.truncate(`${product.name}`, SEO_CONFIG.limits.titleLength);

    const description = product.metaDescription ||
      this.truncate(product.description, SEO_CONFIG.limits.descriptionLength) ||
      `خرید ${product.name} با بهترین قیمت و ارسال رایگان`;

    const keywords = product.metaKeywords ||
      `${product.name}, خرید ${product.name}, ${product.category?.name || ''}`;

    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';
    const productUrl = `${baseUrl}/product/${product.slug}`;
    const imageUrl = product.images?.[0]?.url
      ? (product.images[0].url.startsWith('http')
        ? product.images[0].url
        : `${baseUrl}${product.images[0].url}`)
      : `${baseUrl}/images/default-product.jpg`;

    return {
      title: this.formatTitle(title),
      description,
      keywords: this.truncate(keywords, SEO_CONFIG.limits.keywordsLength),
      canonical: productUrl,
      ogTitle: title,
      ogDescription: description,
      ogImage: imageUrl,
      ogType: 'product',
      ogUrl: productUrl,
      twitterCard: SEO_CONFIG.twitterCard,
      structuredData: {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: product.images?.map(img =>
          img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
        ) || [imageUrl],
        description: product.description,
        sku: product.sku,
        mpn: product.sku,
        brand: {
          '@type': 'Brand',
          name: product.brand?.name || SEO_CONFIG.siteName
        },
        offers: {
          '@type': 'Offer',
          url: productUrl,
          priceCurrency: 'IRR',
          price: product.price,
          availability: product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          seller: {
            '@type': 'Organization',
            name: SEO_CONFIG.siteName
          }
        },
        aggregateRating: product.averageRating ? {
          '@type': 'AggregateRating',
          ratingValue: product.averageRating,
          reviewCount: product.reviewCount || 0,
          bestRating: 5,
          worstRating: 1
        } : undefined
      }
    };
  }

  // متادیتا برای دسته‌بندی‌ها
  generateCategoryMeta(category: any, productsCount?: number) {
    const title = category.metaTitle ||
      this.truncate(`${category.name}`, SEO_CONFIG.limits.titleLength);

    const description = category.metaDescription ||
      this.truncate(category.description, SEO_CONFIG.limits.descriptionLength) ||
      `خرید انواع ${category.name} با بهترین قیمت و کیفیت`;

    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';
    const categoryUrl = `${baseUrl}/category/${category.slug}`;

    return {
      title: this.formatTitle(title),
      description,
      keywords: `${category.name}, خرید ${category.name}`,
      canonical: categoryUrl,
      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      ogUrl: categoryUrl,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: category.name,
        description: category.description,
        url: categoryUrl,
        numberOfItems: productsCount,
      }
    };
  }

  // متادیتا برای صفحه اصلی
  generateHomeMeta() {
    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';

    return {
      title: SEO_CONFIG.defaultTitle,
      description: SEO_CONFIG.defaultDescription,
      canonical: baseUrl,
      ogTitle: SEO_CONFIG.defaultTitle,
      ogDescription: SEO_CONFIG.defaultDescription,
      ogType: 'website',
      ogUrl: baseUrl,
      structuredData: [
        SEO_CONFIG.schemaTypes.organization,
        SEO_CONFIG.schemaTypes.website
      ]
    };
  }

  // Breadcrumb Schema
  generateBreadcrumb(items: Array<{ name: string; url: string }>) {
    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
      }))
    };
  }

  // FAQ Schema
  generateFaqSchema(faqs: Array<{ question: string; answer: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  // Helper functions
  private formatTitle(title: string): string {
    if (title.includes('|')) {
      return title;
    }
    return SEO_CONFIG.titleTemplate.replace('%s', title);
  }

  private truncate(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  // تولید متاتگ‌های Social Media
  generateSocialMeta(data: {
    title: string;
    description: string;
    image?: string;
    url: string;
    type?: string;
  }) {
    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';

    return {
      // Open Graph
      'og:title': data.title,
      'og:description': data.description,
      'og:image': data.image || `${baseUrl}/images/og-default.jpg`,
      'og:url': data.url,
      'og:type': data.type || 'website',
      'og:site_name': SEO_CONFIG.siteName,
      'og:locale': SEO_CONFIG.locale,

      // Twitter Card
      'twitter:card': SEO_CONFIG.twitterCard,
      'twitter:site': SEO_CONFIG.twitterSite,
      'twitter:title': data.title,
      'twitter:description': data.description,
      'twitter:image': data.image || `${baseUrl}/images/twitter-default.jpg`,
    };
  }
}
