import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { HomeSectionService } from '../home-section.service';
import { CreateHomeSectionDto, UpdateHomeSectionDto } from '../dto/home-section.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { ClearHomePageCacheInterceptor } from '../interceptors/clear-homepage-cache.interceptor';

/**
 * کنترلر مدیریت بخش‌های محصولات صفحه اصلی (Home Sections)
 * 
 * این کنترلر تمام عملیات CRUD مربوط به بخش‌های مختلف محصولات در صفحه اصلی را مدیریت می‌کند.
 * هر بخش می‌تواند مجموعه‌ای از محصولات را بر اساس معیارهای مختلف نمایش دهد.
 * 
 * **انواع بخش‌ها (SectionType enum):**
 * 
 * 1. **featured** (محصولات ویژه):
 *    - محصولاتی که فیلد isFeatured=true دارند
 *    - مستقل از انتخاب ادمین
 *    - به صورت خودکار بر اساس علامت‌گذاری محصول
 * 
 * 2. **special_products** (محصولات دستی):
 *    - محصولاتی که ادمین به صورت دستی انتخاب کرده
 *    - نیاز به مشخص کردن product_ids دارد
 *    - کنترل کامل روی محصولات نمایشی
 * 
 * 3. **most_popular** (محبوب‌ترین):
 *    - محصولات بر اساس تعداد فروش (sold_count)
 *    - مرتب‌سازی نزولی (پرفروش‌ترین اول)
 *    - به صورت خودکار بروز می‌شود
 * 
 * 4. **category_based** (بر اساس دسته‌بندی):
 *    - محصولات یک دسته‌بندی خاص
 *    - نیاز به مشخص کردن category_id دارد
 *    - نمایش محصولات جدید آن دسته
 * 
 * **سبک‌های نمایش (SectionDisplayStyle enum):**
 * 
 * - **carousel**: نمایش به صورت اسلایدر افقی (کاروسل)
 * - **grid**: نمایش به صورت گرید (شبکه‌ای)
 * - **list**: نمایش به صورت لیست عمودی
 * 
 * **ویژگی‌های بخش‌ها:**
 * - عنوان و توضیحات قابل تنظیم
 * - انتخاب نوع و سبک نمایش
 * - محدود کردن تعداد محصولات (products_limit)
 * - دکمه "مشاهده همه" اختیاری
 * - مدیریت ترتیب نمایش بخش‌ها
 * - فعال/غیرفعال کردن
 * 
 * **نکات مهم:**
 * - برای special_products حتماً product_ids را مشخص کنید
 * - برای category_based حتماً category_id را مشخص کنید
 * - slug باید یونیک باشد (URL-friendly)
 * - محصولات غیرفعال (isVisible=false) نمایش داده نمی‌شوند
 * - بعد از هر تغییر، کش صفحه اصلی پاک می‌شود
 * 
 * @access Admin, SuperAdmin
 * @requires Bearer Token
 */
@ApiTags('Admin - Home Sections')
@Controller('admin/home-sections')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class HomeSectionAdminController {
  constructor(private readonly homeSectionService: HomeSectionService) { }

  /**
   * ایجاد بخش جدید در صفحه اصلی
   * 
   * این endpoint برای افزودن یک بخش جدید محصولات به صفحه اصلی استفاده می‌شود.
   * 
   * **فیلدهای الزامی:**
   * - title: عنوان بخش (حداکثر 255 کاراکتر)
   * - slug: شناسه URL-friendly (حداکثر 100 کاراکتر، یونیک)
   * - section_type: نوع بخش (featured | special_products | most_popular | category_based)
   * - display_style: سبک نمایش (carousel | grid | list)
   * 
   * **فیلدهای شرطی (بسته به section_type):**
   * - product_ids: الزامی برای special_products (آرایه از IDهای محصول)
   * - category_id: الزامی برای category_based (ID دسته‌بندی)
   * 
   * **فیلدهای اختیاری:**
   * - description: توضیحات بخش
   * - products_limit: تعداد محصولات نمایشی (پیش‌فرض 10)
   * - sort_order: ترتیب نمایش (پیش‌فرض 0)
   * - is_active: فعال/غیرفعال (پیش‌فرض true)
   * - show_view_all_button: نمایش دکمه "مشاهده همه" (پیش‌فرض false)
   * - view_all_link: لینک دکمه "مشاهده همه"
   * 
   * **نکات Validation:**
   * - اگر section_type = special_products → product_ids الزامی است
   * - اگر section_type = category_based → category_id الزامی است
   * - slug باید یونیک باشد
   * - products_limit باید عدد مثبت باشد
   * 
   * @param createDto - داده‌های بخش جدید
   * @returns بخش ایجاد شده
   * 
   * @example محصولات ویژه:
   * {
   *   "title": "محصولات ویژه",
   *   "slug": "featured-products",
   *   "section_type": "featured",
   *   "display_style": "carousel",
   *   "products_limit": 10,
   *   "show_view_all_button": true,
   *   "view_all_link": "/products?featured=true"
   * }
   * 
   * @example محصولات دستی:
   * {
   *   "title": "پیشنهاد ویژه",
   *   "slug": "special-offer",
   *   "section_type": "special_products",
   *   "display_style": "grid",
   *   "product_ids": [1, 5, 10, 15],
   *   "products_limit": 8
   * }
   * 
   * @example دسته‌بندی محور:
   * {
   *   "title": "کتب مذهبی",
   *   "slug": "religious-books",
   *   "section_type": "category_based",
   *   "display_style": "grid",
   *   "category_id": 5,
   *   "products_limit": 12
   * }
   */
  @Post()
  @UseInterceptors(ClearHomePageCacheInterceptor)
  @ApiOperation({
    summary: 'ایجاد بخش جدید در صفحه اصلی',
    description: `
ایجاد یک بخش جدید برای نمایش محصولات در صفحه اصلی.

**انواع بخش (SectionType):**

1️⃣ **featured** (محصولات ویژه)
   - محصولاتی با \`isFeatured = true\`
   - خودکار بر اساس علامت‌گذاری
   - نیازی به product_ids یا category_id ندارد

2️⃣ **special_products** (محصولات دستی)
   - انتخاب دستی توسط ادمین
   - ⚠️ الزامی: باید \`product_ids\` مشخص شود
   - کنترل کامل روی محصولات

3️⃣ **most_popular** (محبوب‌ترین)
   - بر اساس تعداد فروش (\`sold_count\`)
   - مرتب‌سازی نزولی
   - بروزرسانی خودکار
   - نیازی به تنظیمات اضافی ندارد

4️⃣ **category_based** (دسته‌بندی محور)
   - محصولات یک دسته خاص
   - ⚠️ الزامی: باید \`category_id\` مشخص شود
   - نمایش جدیدترین محصولات

**سبک‌های نمایش (DisplayStyle):**
- \`carousel\`: اسلایدر افقی
- \`grid\`: نمایش شبکه‌ای
- \`list\`: لیست عمودی

**دکمه "مشاهده همه":**
- \`show_view_all_button = true\`: دکمه نمایش داده می‌شود
- \`view_all_link\`: لینک هدف دکمه (مثلاً \`/products?category=5\`)

**بعد از ایجاد:**
- کش صفحه اصلی پاک می‌شود
- بخش در صفحه اصلی نمایش داده می‌شود (اگر فعال باشد)
- محصولات بر اساس تنظیمات بارگذاری می‌شوند
    `.trim()
  })
  @ApiBody({
    type: CreateHomeSectionDto,
    description: 'اطلاعات بخش جدید',
    examples: {
      featured: {
        summary: 'محصولات ویژه (Featured)',
        description: 'نمایش خودکار محصولاتی که isFeatured=true دارند',
        value: {
          title: 'محصولات ویژه',
          slug: 'featured-products',
          description: 'بهترین محصولات منتخب ما',
          section_type: 'featured',
          display_style: 'carousel',
          products_limit: 10,
          show_view_all_button: true,
          view_all_link: '/products?featured=true',
          sort_order: 1,
          is_active: true
        }
      },
      specialProducts: {
        summary: 'محصولات دستی (Special Products)',
        description: 'انتخاب دستی محصولات توسط ادمین - نیاز به product_ids',
        value: {
          title: 'پیشنهاد ویژه امروز',
          slug: 'todays-special',
          description: 'محصولات منتخب با تخفیف ویژه',
          section_type: 'special_products',
          display_style: 'grid',
          product_ids: [1, 5, 10, 15, 20],
          products_limit: 8,
          show_view_all_button: false,
          sort_order: 2,
          is_active: true
        }
      },
      mostPopular: {
        summary: 'محبوب‌ترین (Most Popular)',
        description: 'نمایش خودکار بر اساس sold_count',
        value: {
          title: 'پرفروش‌ترین محصولات',
          slug: 'best-sellers',
          description: 'محبوب‌ترین محصولات میان مشتریان',
          section_type: 'most_popular',
          display_style: 'carousel',
          products_limit: 12,
          show_view_all_button: true,
          view_all_link: '/products?sort=popularity',
          sort_order: 3,
          is_active: true
        }
      },
      categoryBased: {
        summary: 'دسته‌بندی محور (Category Based)',
        description: 'نمایش محصولات یک دسته - نیاز به category_id',
        value: {
          title: 'کتب مذهبی',
          slug: 'religious-books',
          description: 'جدیدترین کتاب‌های مذهبی',
          section_type: 'category_based',
          display_style: 'grid',
          category_id: 5,
          products_limit: 12,
          show_view_all_button: true,
          view_all_link: '/category/religious-books',
          sort_order: 4,
          is_active: true
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'بخش با موفقیت ایجاد شد',
    schema: {
      example: {
        id: 1,
        title: 'محصولات ویژه',
        slug: 'featured-products',
        description: 'بهترین محصولات منتخب ما',
        section_type: 'featured',
        display_style: 'carousel',
        product_ids: null,
        category_id: null,
        products_limit: 10,
        sort_order: 1,
        is_active: true,
        show_view_all_button: true,
        view_all_link: '/products?featured=true',
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'داده‌های ورودی نامعتبر',
    schema: {
      examples: {
        missingProductIds: {
          summary: 'product_ids الزامی برای special_products',
          value: {
            statusCode: 400,
            message: 'برای بخش های دستی (special_products)، فیلد product_ids الزامی است و باید حداقل یک محصول انتخاب شده باشد',
            error: 'Bad Request'
          }
        },
        missingCategoryId: {
          summary: 'category_id الزامی برای category_based',
          value: {
            statusCode: 400,
            message: 'برای بخش های دسته‌بندی محور (category_based)، فیلد category_id الزامی است',
            error: 'Bad Request'
          }
        },
        duplicateSlug: {
          summary: 'slug تکراری',
          value: {
            statusCode: 400,
            message: 'Slug already exists',
            error: 'Bad Request'
          }
        }
      }
    }
  })
  async create(@Body() createDto: CreateHomeSectionDto) {
    return await this.homeSectionService.create(createDto);
  }

  /**
   * دریافت لیست تمام بخش‌ها
   * 
   * دریافت لیست کامل بخش‌ها (فعال و غیرفعال).
   * 
   * **مرتب‌سازی:**
   * 1. بر اساس sort_order (صعودی)
   * 2. بر اساس created_at (نزولی - جدیدترین اول)
   * 
   * **نکته:** محصولات بخش‌ها در این endpoint برگردانده نمی‌شوند.
   * برای دریافت محصولات، از endpoint /admin/home-sections/:id/products استفاده کنید.
   * 
   * @returns آرایه‌ای از تمام بخش‌ها
   */
  @Get()
  @ApiOperation({
    summary: 'دریافت لیست تمام بخش‌ها',
    description: `
دریافت لیست کامل بخش‌های صفحه اصلی.

**ترتیب نمایش:**
- ابتدا بر اساس \`sort_order\` (عدد کوچکتر اول)
- سپس بر اساس تاریخ ایجاد (جدیدتر اول)

**نکته مهم:**
- محصولات بخش‌ها در این endpoint برگردانده نمی‌شوند
- برای دریافت محصولات یک بخش: \`GET /admin/home-sections/:id/products\`

**موارد استفاده:**
- مدیریت کلی بخش‌ها
- مشاهده وضعیت فعال/غیرفعال
- تغییر ترتیب نمایش بخش‌ها
- بررسی تنظیمات بخش‌ها
    `.trim()
  })
  @ApiResponse({
    status: 200,
    description: 'لیست بخش‌ها',
    schema: {
      example: [
        {
          id: 1,
          title: 'محصولات ویژه',
          slug: 'featured-products',
          description: 'بهترین محصولات منتخب',
          section_type: 'featured',
          display_style: 'carousel',
          product_ids: null,
          category_id: null,
          products_limit: 10,
          sort_order: 1,
          is_active: true,
          show_view_all_button: true,
          view_all_link: '/products?featured=true',
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z'
        },
        {
          id: 2,
          title: 'پیشنهاد ویژه',
          slug: 'special-offer',
          description: null,
          section_type: 'special_products',
          display_style: 'grid',
          product_ids: [1, 5, 10, 15],
          category_id: null,
          products_limit: 8,
          sort_order: 2,
          is_active: true,
          show_view_all_button: false,
          view_all_link: null,
          created_at: '2024-01-14T09:20:00.000Z',
          updated_at: '2024-01-14T09:20:00.000Z'
        },
        {
          id: 3,
          title: 'کتب مذهبی',
          slug: 'religious-books',
          description: 'جدیدترین کتاب‌ها',
          section_type: 'category_based',
          display_style: 'grid',
          product_ids: null,
          category_id: 5,
          products_limit: 12,
          sort_order: 3,
          is_active: false,
          show_view_all_button: true,
          view_all_link: '/category/religious-books',
          created_at: '2024-01-13T08:15:00.000Z',
          updated_at: '2024-01-13T08:15:00.000Z'
        }
      ]
    }
  })
  async findAll() {
    return await this.homeSectionService.findAll();
  }

  /**
   * دریافت یک بخش با شناسه
   * 
   * دریافت اطلاعات کامل یک بخش مشخص (بدون محصولات).
   * 
   * **نکته:** برای دریافت محصولات این بخش، از endpoint زیر استفاده کنید:
   * GET /admin/home-sections/:id/products
   * 
   * @param id - شناسه عددی بخش
   * @returns اطلاعات کامل بخش
   * @throws NotFoundException - اگر بخش یافت نشود
   */
  @Get(':id')
  @ApiOperation({
    summary: 'دریافت یک بخش با شناسه',
    description: `
دریافت اطلاعات کامل یک بخش مشخص.

**محتوای پاسخ:**
- تمام اطلاعات بخش
- تنظیمات نمایش
- product_ids (برای special_products)
- category_id (برای category_based)

**توجه:**
- محصولات بخش در این endpoint برگردانده نمی‌شوند
- برای دریافت محصولات: \`GET /admin/home-sections/:id/products\`

**موارد استفاده:**
- مشاهده جزئیات کامل بخش
- بارگذاری اطلاعات برای فرم ویرایش
- بررسی تنظیمات بخش
    `.trim()
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'شناسه عددی بخش',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'اطلاعات بخش',
    schema: {
      example: {
        id: 1,
        title: 'محصولات ویژه',
        slug: 'featured-products',
        description: 'بهترین محصولات منتخب ما',
        section_type: 'featured',
        display_style: 'carousel',
        product_ids: null,
        category_id: null,
        products_limit: 10,
        sort_order: 1,
        is_active: true,
        show_view_all_button: true,
        view_all_link: '/products?featured=true',
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'بخش یافت نشد',
    schema: {
      example: {
        statusCode: 404,
        message: 'Home section with ID 999 not found',
        error: 'Not Found'
      }
    }
  })
  async findOne(@Param('id') id: string) {
    return await this.homeSectionService.findOne(+id);
  }

  /**
   * دریافت محصولات یک بخش
   * 
   * دریافت لیست محصولاتی که در این بخش نمایش داده می‌شوند.
   * محصولات بر اساس نوع بخش (section_type) و تنظیمات آن بارگذاری می‌شوند.
   * 
   * **نحوه انتخاب محصولات:**
   * - featured: محصولات با isFeatured=true
   * - special_products: محصولات مشخص شده در product_ids
   * - most_popular: محصولات بر اساس sold_count
   * - category_based: محصولات دسته‌بندی مشخص شده
   * 
   * **محدودیت‌ها:**
   * - تعداد محصولات بر اساس products_limit محدود می‌شود
   * - فقط محصولات فعال (isVisible=true) برگردانده می‌شوند
   * 
   * @param id - شناسه بخش
   * @returns آرایه‌ای از محصولات
   * @throws NotFoundException - اگر بخش یافت نشود
   */
  @Get(':id/products')
  @ApiOperation({
    summary: 'دریافت محصولات یک بخش',
    description: `
دریافت لیست محصولاتی که در این بخش نمایش داده می‌شوند.

**نحوه انتخاب محصولات بر اساس نوع بخش:**

📌 **featured**: 
   - محصولات با \`isFeatured = true\`
   - مرتب‌سازی: جدیدترین اول

📌 **special_products**: 
   - محصولات با ID های مشخص شده در \`product_ids\`
   - ترتیب نمایش: همان ترتیب آرایه product_ids

📌 **most_popular**: 
   - مرتب‌سازی بر اساس \`sold_count\` نزولی
   - پرفروش‌ترین محصولات اول

📌 **category_based**: 
   - محصولات دسته‌بندی \`category_id\`
   - مرتب‌سازی: جدیدترین اول

**محدودیت‌ها:**
- تعداد: محدود به \`products_limit\`
- وضعیت: فقط محصولات فعال (\`isVisible = true\`)
- موجودی: تمام محصولات (حتی ناموجود) نمایش داده می‌شوند

**اطلاعات هر محصول شامل:**
- اطلاعات پایه (نام، قیمت، تخفیف، موجودی)
- تصویر اول محصول
- اطلاعات دسته‌بندی
- اطلاعات برند

**موارد استفاده:**
- پیش‌نمایش محصولات بخش در پنل ادمین
- بررسی صحت تنظیمات بخش
- تست عملکرد بخش قبل از فعال‌سازی
    `.trim()
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'شناسه بخش',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'لیست محصولات بخش',
    schema: {
      example: [
        {
          id: 1,
          name: 'تسبیح عقیق',
          slug: 'aqiq-tasbih',
          price: 250000,
          discount_price: 200000,
          discount_percentage: 20,
          stock: 10,
          is_available: true,
          image: '/uploads/products/tasbih1.jpg',
          category: {
            id: 3,
            name: 'تسبیح',
            slug: 'tasbih'
          },
          brand: {
            id: 2,
            name: 'برند الف',
            slug: 'brand-a'
          }
        },
        {
          id: 5,
          name: 'مصحف طلاکوب',
          slug: 'golden-quran',
          price: 550000,
          discount_price: null,
          discount_percentage: null,
          stock: 5,
          is_available: true,
          image: '/uploads/products/quran1.jpg',
          category: {
            id: 1,
            name: 'قرآن',
            slug: 'quran'
          },
          brand: null
        }
      ]
    }
  })
  @ApiResponse({
    status: 404,
    description: 'بخش یافت نشد',
    schema: {
      example: {
        statusCode: 404,
        message: 'Home section with ID 999 not found',
        error: 'Not Found'
      }
    }
  })
  async getSectionProducts(@Param('id') id: string) {
    return await this.homeSectionService.getSectionProducts(+id);
  }

  /**
   * بخش بروزرسانی بخش های صفحه اصلی
   * 
   * ویرایش اطلاعات یک بخش موجود.
   * تمام فیلدها اختیاری هستند - فقط فیلدهایی که ارسال شوند بروز می‌شوند.
   * 
   * **نکات مهم:**
   * - اگر section_type را تغییر دهید، باید فیلدهای مربوطه را هم تنظیم کنید
   * - تغییر از special_products به نوع دیگر: product_ids پاک می‌شود
   * - تغییر از category_based به نوع دیگر: category_id پاک می‌شود
   * - slug باید یونیک باشد
   * 
   * **سناریوهای متداول:**
   * - تغییر عنوان یا توضیحات
   * - تغییر نوع بخش
   * - تغییر سبک نمایش
   * - بروزرسانی لیست محصولات (special_products)
   * - تغییر دسته‌بندی (category_based)
   * - فعال/غیرفعال کردن
   * - تغییر ترتیب نمایش
   * 
   * @param id - شناسه بخش
   * @param updateDto - فیلدهایی که باید بروزرسانی شوند
   * @returns بخش بروزرسانی شده
   * @throws NotFoundException - اگر بخش یافت نشود
   */
  @Patch(':id')
  @UseInterceptors(ClearHomePageCacheInterceptor)
  @ApiOperation({
    summary: 'بروزرسانی بخش',
    description: `
ویرایش اطلاعات یک بخش موجود.

**نکات:**
- تمام فیلدها اختیاری هستند
- فقط فیلدهای ارسالی بروز می‌شوند
- فیلدهای ارسال نشده بدون تغییر باقی می‌مانند
- بعد از بروزرسانی، کش صفحه اصلی پاک می‌شود

**تغییر نوع بخش:**
⚠️ هنگام تغییر \`section_type\` دقت کنید:
- به \`special_products\`: حتماً \`product_ids\` ارسال کنید
- به \`category_based\`: حتماً \`category_id\` ارسال کنید
- به \`featured\` یا \`most_popular\`: نیازی به فیلد اضافی ندارید

**بروزرسانی محصولات (special_products):**
- آرایه \`product_ids\` جدید جایگزین آرایه قبلی می‌شود
- برای افزودن محصول: کل آرایه + محصول جدید را ارسال کنید
- برای حذف محصول: کل آرایه بدون آن محصول را ارسال کنید

**موارد استفاده متداول:**
- تغییر عنوان یا توضیحات
- تغییر سبک نمایش (carousel ↔ grid ↔ list)
- بروزرسانی لیست محصولات
- تغییر دسته‌بندی
- تغییر محدودیت تعداد محصولات
- فعال/غیرفعال کردن بخش
- تنظیم/حذف دکمه "مشاهده همه"
- تغییر ترتیب نمایش
    `.trim()
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'شناسه بخش',
    example: 1
  })
  @ApiBody({
    type: UpdateHomeSectionDto,
    description: 'فیلدهایی که باید بروزرسانی شوند (همه اختیاری)',
    examples: {
      changeTitle: {
        summary: 'تغییر عنوان',
        value: {
          title: 'عنوان جدید بخش',
          description: 'توضیحات بروز شده'
        }
      },
      changeDisplayStyle: {
        summary: 'تغییر سبک نمایش',
        value: {
          display_style: 'grid'
        }
      },
      updateProducts: {
        summary: 'بروزرسانی محصولات (special_products)',
        value: {
          product_ids: [1, 2, 3, 5, 8, 13]
        }
      },
      changeCategory: {
        summary: 'تغییر دسته‌بندی (category_based)',
        value: {
          title: 'محصولات جدید',
          category_id: 8,
          products_limit: 15
        }
      },
      changeType: {
        summary: 'تغییر نوع به most_popular',
        value: {
          section_type: 'most_popular',
          product_ids: null,
          category_id: null
        }
      },
      toggleViewAll: {
        summary: 'فعال کردن دکمه "مشاهده همه"',
        value: {
          show_view_all_button: true,
          view_all_link: '/products?category=5'
        }
      },
      deactivate: {
        summary: 'غیرفعال کردن',
        value: {
          is_active: false
        }
      },
      fullUpdate: {
        summary: 'بروزرسانی کامل',
        value: {
          title: 'عنوان کاملاً جدید',
          slug: 'new-slug',
          description: 'توضیحات کامل جدید',
          section_type: 'category_based',
          display_style: 'carousel',
          category_id: 10,
          products_limit: 20,
          show_view_all_button: true,
          view_all_link: '/category/new-category',
          sort_order: 5,
          is_active: true
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'بخش با موفقیت بروزرسانی شد',
    schema: {
      example: {
        id: 1,
        title: 'عنوان بروز شده',
        slug: 'updated-slug',
        description: 'توضیحات جدید',
        section_type: 'category_based',
        display_style: 'grid',
        product_ids: null,
        category_id: 8,
        products_limit: 15,
        sort_order: 2,
        is_active: true,
        show_view_all_button: true,
        view_all_link: '/category/new-category',
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-16T14:20:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'داده‌های ورودی نامعتبر',
    schema: {
      example: {
        statusCode: 400,
        message: 'برای بخش های دسته‌بندی محور (category_based)، فیلد category_id الزامی است',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'بخش یافت نشد',
    schema: {
      example: {
        statusCode: 404,
        message: 'Home section with ID 999 not found',
        error: 'Not Found'
      }
    }
  })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateHomeSectionDto) {
    return await this.homeSectionService.update(id, updateDto);
  }

  /**
   * حذف بخش
   * 
   * حذف کامل یک بخش از دیتابیس.
   * 
   * ⚠️ هشدار: این عملیات برگشت‌پذیر نیست!
   * 
   * **توصیه:**
   * - به جای حذف، بخش را غیرفعال کنید (is_active = false)
   * - برای حذف موقت از غیرفعال کردن استفاده کنید
   * - قبل از حذف از عدم وابستگی بخش به سایر قسمت‌ها اطمینان حاصل کنید
   * 
   * @param id - شناسه بخش
   * @returns پیام موفقیت
   * @throws NotFoundException - اگر بخش یافت نشود
   */
  @Delete(':id')
  @UseInterceptors(ClearHomePageCacheInterceptor)
  @ApiOperation({
    summary: 'حذف بخش',
    description: `
حذف کامل یک بخش از دیتابیس.

**⚠️ هشدار مهم:**
- این عملیات برگشت‌پذیر نیست
- بخش به طور کامل از دیتابیس حذف می‌شود
- تنظیمات و پیکربندی بخش از بین می‌رود

**توصیه‌های مهم:**
1. به جای حذف، بخش را غیرفعال کنید (\`is_active = false\`)
2. برای حذف موقت، از غیرفعال کردن استفاده کنید
3. قبل از حذف، مطمئن شوید وابستگی خاصی ندارد
4. فقط در صورت اطمینان کامل، بخش را حذف کنید

**بعد از حذف:**
- کش صفحه اصلی پاک می‌شود
- بخش از صفحه عمومی حذف می‌شود
- ترتیب نمایش سایر بخش‌ها تغییر نمی‌کند
- محصولات اصلی دست نخورده باقی می‌مانند
    `.trim()
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'شناسه بخش',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'بخش با موفقیت حذف شد',
    schema: {
      example: {
        message: 'Home section deleted successfully'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'بخش یافت نشد',
    schema: {
      example: {
        statusCode: 404,
        message: 'Home section with ID 999 not found',
        error: 'Not Found'
      }
    }
  })
  async remove(@Param('id') id: string) {
    await this.homeSectionService.remove(+id);
    return { message: 'Home section deleted successfully' };
  }
}
