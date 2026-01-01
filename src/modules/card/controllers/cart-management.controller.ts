import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CardStatusService } from '../card-status.service';

@ApiTags('Admin - Cart Management')
@Controller('admin/cart-management')
export class CartManagementController {
  constructor(private readonly cardStatusService: CardStatusService) {}

  /**
   * 🔧 تعمیر Cart های duplicate
   * 
   * این endpoint یکبار اجرا کن تا Cart های اضافی رو تمیز کنه
   */
  @Post('fix-duplicates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'تعمیر Cart های duplicate',
    description: `
      اگه کاربری بیش از یک Cart با وضعیت OPEN داره:
      - جدیدترین Cart رو نگه می‌داره
      - بقیه رو ABANDONED می‌کنه
      
      ⚠️ این endpoint فقط یکبار اجرا کن!
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'تعداد کاربران و Cart های تعمیر شده',
    schema: {
      example: {
        success: true,
        affectedUsers: 5,
        abandonedCarts: 7,
        message: 'Fixed 5 users, abandoned 7 duplicate carts',
      },
    },
  })
  async fixDuplicateCarts() {
    const result = await this.cardStatusService.fixDuplicateCarts();

    return {
      success: true,
      affectedUsers: result.affectedUsers,
      abandonedCarts: result.abandonedCarts,
      message: `Fixed ${result.affectedUsers} users, abandoned ${result.abandonedCarts} duplicate carts`,
    };
  }

  /**
   * 📊 گزارش Cart های مشکل‌دار
   * 
   * لیست کاربرایی که بیش از یک Cart OPEN یا LOCKED دارن
   */
  @Get('problem-carts')
  @ApiOperation({
    summary: 'گزارش Cart های مشکل‌دار',
    description: 'لیست کاربرایی که بیش از یک Cart OPEN یا LOCKED دارن',
  })
  @ApiResponse({
    status: 200,
    description: 'لیست کاربران با Cart های مشکل‌دار',
    schema: {
      example: {
        success: true,
        count: 2,
        data: [
          {
            user_id: 123,
            phone: '09123456789',
            email: 'user@example.com',
            open_carts: 2,
            locked_carts: 0,
            abandoned_carts: 5,
            total_carts: 7,
          },
        ],
      },
    },
  })
  async getProblemCarts() {
    const report = await this.cardStatusService.getCartStatusReport();

    return {
      success: true,
      count: report.length,
      data: report,
    };
  }

  /**
   * 📊 آمار کلی Cart ها
   */
  @Get('stats')
  @ApiOperation({
    summary: 'آمار کلی Cart ها',
    description: 'تعداد کل Cart ها به تفکیک وضعیت',
  })
  @ApiResponse({
    status: 200,
    description: 'آمار کلی',
    schema: {
      example: {
        success: true,
        stats: [
          { status: 'open', count: 150 },
          { status: 'locked', count: 5 },
          { status: 'abandoned', count: 320 },
        ],
      },
    },
  })
  async getStats() {
    const stats = await this.cardStatusService.getCartStats();

    return {
      success: true,
      stats,
    };
  }
}
