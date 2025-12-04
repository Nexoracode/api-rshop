export const SEO_CONFIG = {
  // تنظیمات عمومی
  defaultTitle: 'فروشگاه آنلاین | خرید آنلاین محصولات با بهترین قیمت',
  defaultDescription: 'خرید آنلاین انواع محصولات با بهترین قیمت، ضمانت اصالت کالا و ارسال سریع به سراسر کشور',
  titleTemplate: '%s | فروشگاه آنلاین',
  
  // Open Graph
  siteName: 'فروشگاه آنلاین',
  locale: 'fa_IR',
  type: 'website',
  
  // Twitter Card
  twitterCard: 'summary_large_image',
  twitterSite: '@yourshop',
  
  // تنظیمات Sitemap
  sitemap: {
    changefreq: {
      homepage: 'daily',
      categories: 'weekly',
      products: 'weekly',
      staticPages: 'monthly',
    },
    priority: {
      homepage: '1.0',
      categories: '0.8',
      products: '0.9',
      staticPages: '0.7',
    },
  },
  
  // محدودیت‌های متاتگ
  limits: {
    titleLength: 60,
    descriptionLength: 160,
    keywordsLength: 255,
  },
  
  // صفحات استاتیک
  staticPages: [
    { url: '/about', title: 'درباره ما', priority: '0.7', changefreq: 'monthly' },
    { url: '/contact', title: 'تماس با ما', priority: '0.6', changefreq: 'monthly' },
    { url: '/blog', title: 'وبلاگ', priority: '0.8', changefreq: 'weekly' },
    { url: '/faq', title: 'سوالات متداول', priority: '0.6', changefreq: 'monthly' },
    { url: '/terms', title: 'قوانین و مقررات', priority: '0.5', changefreq: 'yearly' },
    { url: '/privacy', title: 'حریم خصوصی', priority: '0.5', changefreq: 'yearly' },
  ],
  
  // تنظیمات Robots.txt
  robots: {
    disallowPaths: [
      '/api/admin/',
      '/api/auth/',
      '/uploads/temp/',
      '/checkout/',
      '/cart/',
      '/profile/',
      '/*?*', // query parameters
    ],
    allowPaths: [
      '/api/products/',
      '/api/categories/',
    ],
    crawlDelay: 1,
  },
  
  // Schema.org Types
  schemaTypes: {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'فروشگاه آنلاین',
      url: process.env.FRONTEND_URL || 'https://yourdomain.com',
      logo: `${process.env.FRONTEND_URL || 'https://yourdomain.com'}/logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+98-21-1234-5678',
        contactType: 'customer service',
        availableLanguage: 'Persian',
      },
      sameAs: [
        'https://www.facebook.com/yourshop',
        'https://www.instagram.com/yourshop',
        'https://twitter.com/yourshop',
      ],
    },
    website: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'فروشگاه آنلاین',
      url: process.env.FRONTEND_URL || 'https://yourdomain.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${process.env.FRONTEND_URL || 'https://yourdomain.com'}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  },
};
