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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { HeroSliderService } from '../hero-slider.service';
import { CreateHeroSliderDto, UpdateHeroSliderDto } from '../dto/hero-slider.dto';
import { AccessGuard } from 'src/common/guard/access.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/common/enums/role.enum';
import { ClearHomePageCacheInterceptor } from '../interceptors/clear-homepage-cache.interceptor';
import { UpdateSortDto } from 'src/modules/attributes/attribute/dto/update-sort-attribute.dto';
import { HeroSliderOrder } from '../dto/her-slider-order.dto';

/**
 * کنترلر مدیریت اسلایدرهای اصلی صفحه (Hero Sliders)
 * 
 * این کنترلر تمام عملیات CRUD مربوط به اسلایدرهای بزرگ صفحه اصلی را مدیریت می‌کند.
 * 
 * ویژگی‌ها:
 * - ایجاد اسلایدر جدید با تصویر، رنگ پس‌زمینه و دکمه
 * - ویرایش اسلایدرهای موجود
 * - حذف اسلایدر
 * - مدیریت ترتیب نمایش اسلایدرها
 * - فعال/غیرفعال کردن اسلایدرها
 * 
 * نکات مهم:
 * - تمام APIها نیاز به احراز هویت دارند (Bearer Token)
 * - فقط ادمین‌ها و سوپر ادمین‌ها دسترسی دارند
 * - بعد از هر تغییر، کش صفحه اصلی پاک می‌شود
 * 
 * @access Admin, SuperAdmin
 * @requires Bearer Token
 */
@ApiTags('Admin - Hero Sliders')
@ApiBearerAuth()
@Controller('admin/hero-sliders')
@UseGuards(AccessGuard, RoleGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class HeroSliderAdminController {
  constructor(private readonly heroSliderService: HeroSliderService) { }

  /**
   * ایجاد اسلایدر جدید
   * 
   * این endpoint برای افزودن یک اسلایدر جدید به صفحه اصلی استفاده می‌شود.
   * اسلایدرها معمولاً برای تبلیغات، محصولات ویژه یا اطلاع‌رسانی‌های مهم استفاده می‌شوند.
   * 
   * فیلدهای مورد نیاز:
   * - title: عنوان اسلایدر (حداکثر 255 کاراکتر)
   * - image_url: آدرس تصویر اسلایدر (محلی یا آنلاین)
   * 
   * فیلدهای اختیاری:
   * - description: توضیحات اسلایدر (text)
   * - background_color: رنگ پس‌زمینه به فرمت Hex (#FF6B6B)
   * - button_text: متن دکمه (مثلاً "مشاهده محصول")
   * - button_link: لینک دکمه (مثلاً "/products/123")
   * - display_order: ترتیب نمایش (عدد صحیح، پیش‌فرض 0)
   * - is_active: فعال/غیرفعال (boolean، پیش‌فرض true)
   * 
   * @param createDto - داده‌های اسلایدر جدید
   * @returns اسلایدر ایجاد شده
   * 
   * @example
   * POST /admin/hero-sliders
   * {
   *   "title": "تسبیح تایگر چشم بین",
   *   "description": "تسبیح دست‌ساز با سنگ‌های طبیعی",
   *   "image_url": "/uploads/sliders/slider1.jpg",
   *   "background_color": "#E8B4D9",
   *   "button_text": "مشاهده محصول",
   *   "button_link": "/products/tiger-eye-tasbih",
   *   "display_order": 1,
   *   "is_active": true
   * }
   */
  @Post()
  @UseInterceptors(ClearHomePageCacheInterceptor)
  @ApiOperation({
    summary: 'ایجاد اسلایدر جدید',
    description: `
ایجاد یک اسلایدر جدید برای صفحه اصلی.

**نکات مهم:**
- تصویر باید قبلاً آپلود شده باشد
- رنگ پس‌زمینه باید به فرمت Hex باشد (مثال: #FF6B6B)
- display_order برای تعیین ترتیب نمایش استفاده می‌شود (عدد کوچکتر = اولویت بالاتر)
- اگر is_active = false باشد، اسلایدر در صفحه عمومی نمایش داده نمی‌شود

**بعد از ایجاد:**
- کش صفحه اصلی پاک می‌شود
- اسلایدر بلافاصله در صفحه اصلی نمایش داده می‌شود (اگر فعال باشد)
    `.trim()
  })
  @ApiBody({
    type: CreateHeroSliderDto,
    description: 'اطلاعات اسلایدر جدید',
    examples: {
      example1: {
        summary: 'اسلایدر ساده',
        value: {
          title: 'تسبیح تایگر چشم بین',
          image_url: '/uploads/sliders/slider1.jpg',
          background_color: '#E8B4D9',
          is_dark: false,
          display_order: 1,
          is_active: true
        }
      },
      example2: {
        summary: 'اسلایدر کامل با دکمه',
        value: {
          title: 'مصحف همراه طلاکوب',
          description: 'بهترین کیفیت چاپ و صحافی',
          image_url: '/uploads/sliders/slider2.jpg',
          background_color: '#B8D4E8',
          is_dark: false,
          button_text: 'خرید محصول',
          button_link: '/products/golden-quran',
          display_order: 2,
          is_active: true
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'اسلایدر با موفقیت ایجاد شد',
    schema: {
      example: {
        id: 1,
        title: 'تسبیح تایگر چشم بین',
        description: 'تسبیح دست‌ساز با سنگ‌های طبیعی',
        image_url: '/uploads/sliders/slider1.jpg',
        background_color: '#E8B4D9',
        button_text: 'مشاهده محصول',
        button_link: '/products/tiger-eye-tasbih',
        display_order: 1,
        is_active: true,
        is_dark: false,
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
          'image_url must be a string',
          'background_color must be a valid hex color'
        ],
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'کاربر احراز هویت نشده است',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'کاربر دسترسی لازم را ندارد',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden'
      }
    }
  })
  async create(@Body() createDto: CreateHeroSliderDto) {
    return await this.heroSliderService.create(createDto);
  }

  /**
   * دریافت لیست تمام اسلایدرها
   * 
   * این endpoint لیست کامل اسلایدرها (فعال و غیرفعال) را برمی‌گرداند.
   * نتایج به ترتیب display_order و سپس تاریخ ایجاد مرتب می‌شوند.
   * 
   * مرتب‌سازی:
   * 1. بر اساس display_order (صعودی)
   * 2. بر اساس created_at (نزولی - جدیدترین اول)
   * 
   * @returns آرایه‌ای از تمام اسلایدرها
   * 
   * @example
   * GET /admin/hero-sliders
   * Response: [
   *   {
   *     "id": 1,
   *     "title": "اسلایدر اول",
   *     "display_order": 1,
   *     "is_active": true,
   *     ...
   *   },
   *   {
   *     "id": 2,
   *     "title": "اسلایدر دوم",
   *     "display_order": 2,
   *     "is_active": false,
   *     ...
   *   }
   * ]
   */
  @Get()
  @ApiOperation({
    summary: 'دریافت لیست تمام اسلایدرها',
    description: `
دریافت لیست کامل اسلایدرها شامل موارد فعال و غیرفعال.

**ترتیب نمایش:**
- ابتدا بر اساس display_order (عدد کوچکتر اول)
- سپس بر اساس تاریخ ایجاد (جدیدتر اول)

**موارد استفاده:**
- مدیریت و ویرایش اسلایدرها
- مشاهده وضعیت فعال/غیرفعال
- تغییر ترتیب نمایش
    `.trim()
  })
  @ApiResponse({
    status: 200,
    description: 'لیست اسلایدرها با موفقیت دریافت شد',
    schema: {
      example: [
        {
          id: 1,
          title: 'تسبیح تایگر چشم بین',
          description: 'تسبیح دست‌ساز',
          image_url: '/uploads/sliders/slider1.jpg',
          background_color: '#E8B4D9',
          button_text: 'مشاهده',
          button_link: '/products/123',
          display_order: 1,
          is_active: true,
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z'
        },
        {
          id: 2,
          title: 'مصحف همراه',
          description: null,
          image_url: '/uploads/sliders/slider2.jpg',
          background_color: '#B8D4E8',
          button_text: null,
          button_link: null,
          display_order: 2,
          is_active: false,
          created_at: '2024-01-14T09:20:00.000Z',
          updated_at: '2024-01-14T09:20:00.000Z'
        }
      ]
    }
  })
  async findAll() {
    return await this.heroSliderService.findAll();
  }

  /**
   * دریافت یک اسلایدر با شناسه
   * 
   * دریافت اطلاعات کامل یک اسلایدر خاص.
   * 
   * @param id - شناسه عددی اسلایدر
   * @returns اطلاعات کامل اسلایدر
   * @throws NotFoundException - اگر اسلایدر یافت نشود
   * 
   * @example
   * GET /admin/hero-sliders/1
   */
  @Get(':id')
  @ApiOperation({
    summary: 'دریافت یک اسلایدر با شناسه',
    description: `
دریافت اطلاعات کامل یک اسلایدر مشخص.

**موارد استفاده:**
- مشاهده جزئیات کامل اسلایدر
- بارگذاری اطلاعات برای فرم ویرایش
- بررسی وضعیت یک اسلایدر خاص
    `.trim()
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'شناسه عددی اسلایدر',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'اطلاعات اسلایدر',
    schema: {
      example: {
        id: 1,
        title: 'تسبیح تایگر چشم بین',
        description: 'تسبیح دست‌ساز با سنگ‌های طبیعی',
        image_url: '/uploads/sliders/slider1.jpg',
        background_color: '#E8B4D9',
        button_text: 'مشاهده محصول',
        button_link: '/products/tiger-eye-tasbih',
        display_order: 1,
        is_active: true,
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'اسلایدر یافت نشد',
    schema: {
      example: {
        statusCode: 404,
        message: 'Hero slider with ID 999 not found',
        error: 'Not Found'
      }
    }
  })
  async findOne(@Param('id') id: string) {
    return await this.heroSliderService.findOne(+id);
  }

  /**
   * بروزرسانی اسلایدر
   * 
   * ویرایش اطلاعات یک اسلایدر موجود.
   * تمام فیلدها اختیاری هستند - فقط فیلدهایی که ارسال شوند بروز می‌شوند.
   * 
   * @param id - شناسه اسلایدر
   * @param updateDto - فیلدهایی که باید بروزرسانی شوند
   * @returns اسلایدر بروزرسانی شده
   * @throws NotFoundException - اگر اسلایدر یافت نشود
   * 
   * @example
   * PATCH /admin/hero-sliders/1
   * {
   *   "title": "عنوان جدید",
   *   "is_active": false
   * }
   */
  @Patch(':id')
  @UseInterceptors(ClearHomePageCacheInterceptor)
  @ApiOperation({
    summary: 'بروزرسانی اسلایدر',
    description: `
ویرایش اطلاعات یک اسلایدر موجود.

**نکات:**
- تمام فیلدها اختیاری هستند
- فقط فیلدهای ارسالی بروز می‌شوند
- فیلدهای ارسال نشده بدون تغییر باقی می‌مانند
- بعد از بروزرسانی، کش صفحه اصلی پاک می‌شود

**موارد استفاده متداول:**
- تغییر عنوان یا توضیحات
- تعویض تصویر
- تغییر رنگ پس‌زمینه
- ویرایش متن و لینک دکمه
- فعال/غیرفعال کردن
- تغییر ترتیب نمایش
    `.trim()
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'شناسه اسلایدر',
    example: 1
  })
  @ApiBody({
    type: UpdateHeroSliderDto,
    description: 'فیلدهایی که باید بروزرسانی شوند (همه اختیاری)',
    examples: {
      changeTitle: {
        summary: 'تغییر عنوان',
        value: {
          title: 'عنوان جدید اسلایدر'
        }
      },
      changeImage: {
        summary: 'تعویض تصویر و رنگ',
        value: {
          image_url: '/uploads/sliders/new-image.jpg',
          background_color: '#FF5733'
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
          description: 'توضیحات جدید',
          image_url: '/uploads/sliders/updated.jpg',
          background_color: '#4A90E2',
          button_text: 'متن جدید دکمه',
          button_link: '/new-link',
          display_order: 5,
          is_active: true
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'اسلایدر با موفقیت بروزرسانی شد',
    schema: {
      example: {
        id: 1,
        title: 'عنوان بروز شده',
        description: 'توضیحات جدید',
        image_url: '/uploads/sliders/updated.jpg',
        background_color: '#4A90E2',
        button_text: 'متن جدید دکمه',
        button_link: '/new-link',
        display_order: 5,
        is_active: true,
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-16T14:20:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'اسلایدر یافت نشد',
    schema: {
      example: {
        statusCode: 404,
        message: 'Hero slider with ID 999 not found',
        error: 'Not Found'
      }
    }
  })
  async update(@Param('id') id: string, @Body() updateDto: UpdateHeroSliderDto) {
    return await this.heroSliderService.update(+id, updateDto);
  }

  /**
   * حذف اسلایدر
   * 
   * حذف کامل یک اسلایدر از دیتابیس.
   * 
   * ⚠️ هشدار: این عملیات برگشت‌پذیر نیست!
   * 
   * @param id - شناسه اسلایدر
   * @returns پیام موفقیت
   * @throws NotFoundException - اگر اسلایدر یافت نشود
   * 
   * @example
   * DELETE /admin/hero-sliders/1
   */
  @Delete(':id')
  @UseInterceptors(ClearHomePageCacheInterceptor)
  @ApiOperation({
    summary: 'حذف اسلایدر',
    description: `
حذف کامل یک اسلایدر از دیتابیس.

**⚠️ هشدار مهم:**
- این عملیات برگشت‌پذیر نیست
- اسلایدر به طور کامل از دیتابیس حذف می‌شود
- تمام اطلاعات مرتبط (آمار کلیک‌ها) همچنان باقی می‌ماند

**توصیه:**
- به جای حذف، می‌توانید اسلایدر را غیرفعال کنید (is_active = false)
- برای حذف موقت، از غیرفعال کردن استفاده کنید
- فقط در صورت اطمینان کامل، اسلایدر را حذف کنید

**بعد از حذف:**
- کش صفحه اصلی پاک می‌شود
- اسلایدر از صفحه عمومی حذف می‌شود
    `.trim()
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'شناسه اسلایدر',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'اسلایدر با موفقیت حذف شد',
    schema: {
      example: {
        message: 'Hero slider deleted successfully'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'اسلایدر یافت نشد',
    schema: {
      example: {
        statusCode: 404,
        message: 'Hero slider with ID 999 not found',
        error: 'Not Found'
      }
    }
  })
  async remove(@Param('id') id: string) {
    await this.heroSliderService.remove(+id);
    return { message: 'Hero slider deleted successfully' };
  }

  @Patch(':id/order')
  @UseInterceptors(ClearHomePageCacheInterceptor)
  @ApiOperation({ summary: 'تغییر ترتیب نمایش اسلایدر' })
  async updateSortOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: HeroSliderOrder,
  ) {
    return this.heroSliderService.updateSortOrder(id, data);
  }
}
