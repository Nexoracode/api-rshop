import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SideBannerService } from '../side-banner.service';
import { CreateSideBannerDto, UpdateSideBannerDto } from '../dto/side-banner.dto';
import { BannerPosition } from '../entities/side-banner.entity';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { ClearHomePageCacheInterceptor } from '../interceptors/clear-homepage-cache.interceptor';

/**
 * کنترلر مدیریت بنرهای کناری (Side Banners)
 * 
 * این کنترلر تمام عملیات CRUD مربوط به بنرهای کوچک کناری صفحه اصلی را مدیریت می‌کند.
 * بنرهای کناری معمولاً در کنار محتوای اصلی نمایش داده می‌شوند.
 * 
 * **انواع موقعیت‌های بنر (BannerPosition enum):**
 * - top_right: بالای سمت راست صفحه
 * - middle_right: وسط سمت راست صفحه
 * - bottom_right: پایین سمت راست صفحه
 * 
 * **ویژگی‌های بنرها:**
 * - نمایش در موقعیت‌های مختلف
 * - قابلیت افزودن برچسب تخفیف (badge)
 * - عنوان و زیرعنوان قابل تنظیم
 * - لینک‌دهی به صفحات مختلف
 * - مدیریت ترتیب نمایش در هر موقعیت
 * - فعال/غیرفعال کردن
 * 
 * **نکات مهم:**
 * - می‌توانید چند بنر در یک موقعیت داشته باشید
 * - بنرهای یک موقعیت بر اساس sort_order مرتب می‌شوند
 * - برچسب تخفیف (badge) اختیاری است
 * - بعد از هر تغییر، کش صفحه اصلی پاک می‌شود
 * 
 * @access Admin, SuperAdmin
 * @requires Bearer Token
 */
@ApiTags('Admin - Side Banners')
@ApiBearerAuth()
@Controller('admin/side-banners')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class SideBannerAdminController {
  constructor(private readonly sideBannerService: SideBannerService) { }

  /**
   * ایجاد بنر کناری جدید
   * 
   * این endpoint برای افزودن یک بنر جدید به صفحه اصلی استفاده می‌شود.
   * بنرها معمولاً برای تبلیغات کوچک، معرفی دسته‌بندی‌ها یا تخفیف‌های ویژه استفاده می‌شوند.
   * 
   * **فیلدهای الزامی:**
   * - title: عنوان بنر (حداکثر 255 کاراکتر)
   * - image_url: آدرس تصویر بنر
   * - position: موقعیت نمایش (top_right | middle_right | bottom_right)
   * 
   * **فیلدهای اختیاری:**
   * - subtitle: زیرعنوان بنر (مثلاً محدوده قیمت)
   * - link: لینک هدف بنر
   * - badge_text: متن برچسب (مثلاً "14%" برای تخفیف)
   * - badge_color: رنگ برچسب به فرمت Hex
   * - sort_order: ترتیب نمایش (پیش‌فرض 0)
   * - is_active: فعال/غیرفعال (پیش‌فرض true)
   * 
   * **موقعیت‌های مجاز (position):**
   * - top_right: بالای سمت راست
   * - middle_right: وسط سمت راست  
   * - bottom_right: پایین سمت راست
   * 
   * @param createDto - داده‌های بنر جدید
   * @returns بنر ایجاد شده
   * 
   * @example
   * POST /admin/side-banners
   * {
   *   "title": "مصحف همراه (طلاکوب)",
   *   "subtitle": "از ۵۴۹ تا ۵۵۹ هزار تومان",
   *   "image_url": "/uploads/banners/banner1.jpg",
   *   "link": "/category/quran",
   *   "position": "top_right",
   *   "badge_text": "14%",
   *   "badge_color": "#FF0000",
   *   "is_active": true
   * }
   */
  @Post()
  @UseInterceptors(ClearHomePageCacheInterceptor)
  @ApiOperation({ 
    summary: 'ایجاد بنر کناری جدید',
    description: `
ایجاد یک بنر کناری جدید برای صفحه اصلی.

**موقعیت‌های مجاز (BannerPosition enum):**
- \`top_right\`: بالای سمت راست صفحه
- \`middle_right\`: وسط سمت راست صفحه
- \`bottom_right\`: پایین سمت راست صفحه

**نکات مهم:**
- می‌توانید چند بنر در یک موقعیت داشته باشید
- بنرهای یک موقعیت بر اساس sort_order مرتب می‌شوند
- برچسب تخفیف (badge) اختیاری است
- اگر badge_text مشخص شود، badge_color هم باید مشخص شود
- تصویر باید قبلاً آپلود شده باشد

**برچسب تخفیف (Badge):**
- برای نمایش درصد تخفیف یا پیشنهاد ویژه
- badge_text: متن نمایشی (مثلاً "14%" یا "جدید")
- badge_color: رنگ پس‌زمینه برچسب (#FF0000 برای قرمز)

**بعد از ایجاد:**
- کش صفحه اصلی پاک می‌شود
- بنر بلافاصله در موقعیت مشخص شده نمایش داده می‌شود (اگر فعال باشد)
    `.trim()
  })
  @ApiBody({ 
    type: CreateSideBannerDto,
    description: 'اطلاعات بنر جدید',
    examples: {
      simple: {
        summary: 'بنر ساده بدون برچسب',
        value: {
          title: 'مصحف همراه',
          subtitle: 'بهترین کیفیت چاپ',
          image_url: '/uploads/banners/banner1.jpg',
          link: '/category/quran',
          position: 'top_right',
          is_active: true
        }
      },
      withBadge: {
        summary: 'بنر با برچسب تخفیف',
        value: {
          title: 'تسبیح چشم بیر',
          subtitle: 'تخفیف ویژه محصولات',
          image_url: '/uploads/banners/banner2.jpg',
          link: '/category/tasbih',
          position: 'middle_right',
          badge_text: '20%',
          badge_color: '#FF0000',
          sort_order: 1,
          is_active: true
        }
      },
      complete: {
        summary: 'بنر کامل',
        value: {
          title: 'کتب مذهبی',
          subtitle: 'جدیدترین عناوین',
          image_url: '/uploads/banners/banner3.jpg',
          link: '/category/books',
          position: 'bottom_right',
          badge_text: 'جدید',
          badge_color: '#4CAF50',
          sort_order: 2,
          is_active: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'بنر با موفقیت ایجاد شد',
    schema: {
      example: {
        id: 1,
        title: 'مصحف همراه (طلاکوب)',
        subtitle: 'از ۵۴۹ تا ۵۵۹ هزار تومان',
        image_url: '/uploads/banners/banner1.jpg',
        link: '/category/quran',
        position: 'top_right',
        badge_text: '14%',
        badge_color: '#FF0000',
        sort_order: 0,
        is_active: true,
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'داده‌های ورودی نامعتبر',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'title must be a string',
          'position must be a valid enum value (top_right, middle_right, bottom_right)',
          'badge_color must be a valid hex color'
        ],
        error: 'Bad Request'
      }
    }
  })
  async create(@Body() createDto: CreateSideBannerDto) {
    return await this.sideBannerService.create(createDto);
  }

  /**
   * دریافت لیست بنرهای کناری
   * 
   * دریافت لیست بنرها با قابلیت فیلتر کردن بر اساس موقعیت.
   * 
   * **بدون فیلتر:**
   * - تمام بنرها (فعال و غیرفعال) برگردانده می‌شوند
   * - مرتب‌سازی: ابتدا بر اساس position، سپس sort_order
   * 
   * **با فیلتر position:**
   * - فقط بنرهای فعال موقعیت مشخص شده برگردانده می‌شوند
   * - مرتب‌سازی بر اساس sort_order
   * 
   * @param position - (اختیاری) فیلتر بر اساس موقعیت
   * @returns آرایه‌ای از بنرها
   * 
   * @example
   * GET /admin/side-banners
   * GET /admin/side-banners?position=top_right
   */
  @Get()
  @ApiOperation({ 
    summary: 'دریافت لیست بنرهای کناری',
    description: `
دریافت لیست بنرها با قابلیت فیلتر.

**بدون Query Parameter:**
- تمام بنرها (فعال و غیرفعال) برگردانده می‌شوند
- مرتب‌سازی: position (ASC) ← sort_order (ASC)

**با Query Parameter position:**
- فقط بنرهای فعال آن موقعیت برگردانده می‌شوند
- مرتب‌سازی بر اساس sort_order

**موقعیت‌های مجاز:**
- \`top_right\`: بنرهای بالای صفحه
- \`middle_right\`: بنرهای وسط صفحه
- \`bottom_right\`: بنرهای پایین صفحه

**موارد استفاده:**
- مدیریت کلی تمام بنرها
- مشاهده بنرهای یک موقعیت خاص
- بررسی ترتیب نمایش
    `.trim()
  })
  @ApiQuery({
    name: 'position',
    required: false,
    enum: BannerPosition,
    description: 'فیلتر بر اساس موقعیت بنر',
    example: 'top_right',
    enumName: 'BannerPosition'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'لیست بنرها',
    schema: {
      example: [
        {
          id: 1,
          title: 'مصحف همراه',
          subtitle: 'قیمت ویژه',
          image_url: '/uploads/banners/banner1.jpg',
          link: '/category/quran',
          position: 'top_right',
          badge_text: null,
          badge_color: null,
          sort_order: 1,
          is_active: true,
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z'
        },
        {
          id: 2,
          title: 'تسبیح چشم بیر',
          subtitle: 'محصولات جدید',
          image_url: '/uploads/banners/banner2.jpg',
          link: '/category/tasbih',
          position: 'top_right',
          badge_text: '14%',
          badge_color: '#FF0000',
          sort_order: 2,
          is_active: true,
          created_at: '2024-01-14T09:20:00.000Z',
          updated_at: '2024-01-14T09:20:00.000Z'
        }
      ]
    }
  })
  async findAll(@Query('position') position?: BannerPosition) {
    if (position) {
      return await this.sideBannerService.findByPosition(position);
    }
    return await this.sideBannerService.findAll();
  }

  /**
   * دریافت یک بنر با شناسه
   * 
   * دریافت اطلاعات کامل یک بنر مشخص.
   * 
   * @param id - شناسه عددی بنر
   * @returns اطلاعات کامل بنر
   * @throws NotFoundException - اگر بنر یافت نشود
   * 
   * @example
   * GET /admin/side-banners/1
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'دریافت یک بنر با شناسه',
    description: `
دریافت اطلاعات کامل یک بنر مشخص.

**موارد استفاده:**
- مشاهده جزئیات کامل بنر
- بارگذاری اطلاعات برای فرم ویرایش
- بررسی وضعیت یک بنر خاص
- مشاهده تنظیمات برچسب تخفیف
    `.trim()
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number',
    description: 'شناسه عددی بنر',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'اطلاعات بنر',
    schema: {
      example: {
        id: 1,
        title: 'مصحف همراه (طلاکوب)',
        subtitle: 'از ۵۴۹ تا ۵۵۹ هزار تومان',
        image_url: '/uploads/banners/banner1.jpg',
        link: '/category/quran',
        position: 'top_right',
        badge_text: '14%',
        badge_color: '#FF0000',
        sort_order: 1,
        is_active: true,
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'بنر یافت نشد',
    schema: {
      example: {
        statusCode: 404,
        message: 'Side banner with ID 999 not found',
        error: 'Not Found'
      }
    }
  })
  async findOne(@Param('id') id: string) {
    return await this.sideBannerService.findOne(+id);
  }

  /**
   * بروزرسانی بنر
   * 
   * ویرایش اطلاعات یک بنر موجود.
   * تمام فیلدها اختیاری هستند - فقط فیلدهایی که ارسال شوند بروز می‌شوند.
   * 
   * **نکات:**
   * - برای حذف برچسب، badge_text و badge_color را null ارسال کنید
   * - برای تغییر موقعیت، position جدید را ارسال کنید
   * - sort_order فقط در همان موقعیت تأثیر دارد
   * 
   * @param id - شناسه بنر
   * @param updateDto - فیلدهایی که باید بروزرسانی شوند
   * @returns بنر بروزرسانی شده
   * @throws NotFoundException - اگر بنر یافت نشود
   * 
   * @example
   * PATCH /admin/side-banners/1
   * {
   *   "title": "عنوان جدید",
   *   "badge_text": "20%",
   *   "badge_color": "#00FF00"
   * }
   */
  @Patch(':id')
  @UseInterceptors(ClearHomePageCacheInterceptor)
  @ApiOperation({ 
    summary: 'بروزرسانی بنر',
    description: `
ویرایش اطلاعات یک بنر موجود.

**نکات:**
- تمام فیلدها اختیاری هستند
- فقط فیلدهای ارسالی بروز می‌شوند
- فیلدهای ارسال نشده بدون تغییر باقی می‌مانند
- بعد از بروزرسانی، کش صفحه اصلی پاک می‌شود

**تغییر موقعیت:**
- می‌توانید بنر را به موقعیت دیگری منتقل کنید
- sort_order در موقعیت جدید اعمال می‌شود

**مدیریت برچسب:**
- برای افزودن برچسب: badge_text و badge_color را ارسال کنید
- برای حذف برچسب: badge_text = null ارسال کنید
- برای تغییر رنگ: فقط badge_color جدید ارسال کنید

**موارد استفاده متداول:**
- تغییر عنوان یا زیرعنوان
- تعویض تصویر
- تغییر موقعیت نمایش
- افزودن/حذف/ویرایش برچسب تخفیف
- تغییر لینک هدف
- فعال/غیرفعال کردن
- تغییر ترتیب نمایش
    `.trim()
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number',
    description: 'شناسه بنر',
    example: 1
  })
  @ApiBody({ 
    type: UpdateSideBannerDto,
    description: 'فیلدهایی که باید بروزرسانی شوند (همه اختیاری)',
    examples: {
      changeTitle: {
        summary: 'تغییر عنوان و زیرعنوان',
        value: {
          title: 'عنوان جدید',
          subtitle: 'زیرعنوان جدید'
        }
      },
      addBadge: {
        summary: 'افزودن برچسب تخفیف',
        value: {
          badge_text: '25%',
          badge_color: '#FF0000'
        }
      },
      removeBadge: {
        summary: 'حذف برچسب',
        value: {
          badge_text: null,
          badge_color: null
        }
      },
      changePosition: {
        summary: 'تغییر موقعیت',
        value: {
          position: 'bottom_right',
          sort_order: 1
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
          title: 'عنوان بروز شده',
          subtitle: 'زیرعنوان جدید',
          image_url: '/uploads/banners/new-banner.jpg',
          link: '/new-category',
          position: 'middle_right',
          badge_text: '30%',
          badge_color: '#4CAF50',
          sort_order: 3,
          is_active: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'بنر با موفقیت بروزرسانی شد',
    schema: {
      example: {
        id: 1,
        title: 'عنوان بروز شده',
        subtitle: 'زیرعنوان جدید',
        image_url: '/uploads/banners/new-banner.jpg',
        link: '/new-category',
        position: 'middle_right',
        badge_text: '30%',
        badge_color: '#4CAF50',
        sort_order: 3,
        is_active: true,
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-16T14:20:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'بنر یافت نشد',
    schema: {
      example: {
        statusCode: 404,
        message: 'Side banner with ID 999 not found',
        error: 'Not Found'
      }
    }
  })
  async update(@Param('id') id: string, @Body() updateDto: UpdateSideBannerDto) {
    return await this.sideBannerService.update(+id, updateDto);
  }

  /**
   * حذف بنر
   * 
   * حذف کامل یک بنر از دیتابیس.
   * 
   * ⚠️ هشدار: این عملیات برگشت‌پذیر نیست!
   * 
   * **توصیه:**
   * - به جای حذف، بنر را غیرفعال کنید (is_active = false)
   * - برای حذف موقت از غیرفعال کردن استفاده کنید
   * 
   * @param id - شناسه بنر
   * @returns پیام موفقیت
   * @throws NotFoundException - اگر بنر یافت نشود
   * 
   * @example
   * DELETE /admin/side-banners/1
   */
  @Delete(':id')
  @UseInterceptors(ClearHomePageCacheInterceptor)
  @ApiOperation({ 
    summary: 'حذف بنر',
    description: `
حذف کامل یک بنر از دیتابیس.

**⚠️ هشدار مهم:**
- این عملیات برگشت‌پذیر نیست
- بنر به طور کامل از دیتابیس حذف می‌شود
- تمام اطلاعات مرتبط (آمار کلیک‌ها) همچنان باقی می‌ماند

**توصیه:**
- به جای حذف، می‌توانید بنر را غیرفعال کنید (is_active = false)
- برای حذف موقت، از غیرفعال کردن استفاده کنید
- فقط در صورت اطمینان کامل، بنر را حذف کنید

**بعد از حذف:**
- کش صفحه اصلی پاک می‌شود
- بنر از صفحه عمومی حذف می‌شود
- ترتیب نمایش سایر بنرها تغییر نمی‌کند
    `.trim()
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number',
    description: 'شناسه بنر',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'بنر با موفقیت حذف شد',
    schema: {
      example: {
        message: 'Side banner deleted successfully'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'بنر یافت نشد',
    schema: {
      example: {
        statusCode: 404,
        message: 'Side banner with ID 999 not found',
        error: 'Not Found'
      }
    }
  })
  async remove(@Param('id') id: string) {
    await this.sideBannerService.remove(+id);
    return { message: 'Side banner deleted successfully' };
  }
}
