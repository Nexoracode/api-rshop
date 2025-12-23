import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { SEO_CONFIG } from './seo.config';
import { getAverageRating } from 'src/common/helpers/review.helper';

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
      take: 50000,
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
          `${baseUrl}/collection/${category.slug}`,
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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
    const averages = getAverageRating(product.reviews || []);
    const title = this.truncate(`${product.name}`, SEO_CONFIG.limits.titleLength);
    const description = this.truncate(product.description!, SEO_CONFIG.limits.descriptionLength) ||
      `خرید ${product.name} با بهترین قیمت`;
    const keywords = `${product.name}, خرید ${product.name}, ${product.category?.title || ''}`;
    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';
    const productUrl = `${baseUrl}/product/${product.name}`;
    const imageUrl = product.medias?.[0]?.url
      ? (product.medias[0].url.startsWith('http')
        ? product.medias[0].url
        : `${baseUrl}${product.medias[0].url}`)
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
      structuredData: {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: product.medias?.map(img =>
          img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
        ) || [imageUrl],
        description: product.description,
        sku: product.id.toString(),
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
            .split('T')[0]
        },
        aggregateRating: product.averageRaiting ? {
          '@type': 'AggregateRating',
          ratingValue: product.averageRaiting,
          reviewCount: product.reviewsCount || 0,
          bestRating: 5,
          worstRating: 1
        } : undefined
      }
    };
  }

  // متادیتا برای دسته‌بندی‌ها
  generateCategoryMeta(category: any) {
    const title = this.truncate(`${category.title}`, SEO_CONFIG.limits.titleLength);
    const description = this.truncate(category.description, SEO_CONFIG.limits.descriptionLength) ||
      `خرید انواع ${category.title} با بهترین قیمت`;
    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';
    const categoryUrl = `${baseUrl}/collection/${category.slug}`;

    return {
      title: this.formatTitle(title),
      description,
      keywords: `${category.title}, خرید ${category.title}`,
      canonical: categoryUrl,
      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      ogUrl: categoryUrl,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: category.title,
        description: description,
        url: categoryUrl,
      }
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

  // Helper functions
  private formatTitle(title: string): string {
    if (title.includes('|')) return title;
    return SEO_CONFIG.titleTemplate.replace('%s', title);
  }

  private truncate(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
