import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecentView } from './entities/recent-view.entity';
import { CreateRecentViewDto } from './dto/create-recent-view.dto';
import { RequestUser } from 'src/common/interfaces/request-user.interface';
import { RecentViewMapper } from './mappers/recent-view.mapper';

@Injectable()
export class RecentViewService {
  private readonly logger = new Logger(RecentViewService.name);
  private MAX_VIEWS = 20; // حداکثر تعداد آیتم ذخیره‌شده برای هر کاربر

  constructor(
    @InjectRepository(RecentView)
    private readonly repo: Repository<RecentView>,
  ) { }

  /**
   * ✅ افزودن محصول به بازدیدهای اخیر
   * 
   * از Upsert استفاده می‌کنه تا Race Condition نداشته باشیم
   */
  async add(user: RequestUser, dto: CreateRecentViewDto) {
    try {
      // ✅ استفاده از Upsert برای جلوگیری از Race Condition
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(RecentView)
        .values({
          userId: user.id,
          productId: dto.productId,
          updatedAt: new Date(),
        })
        .orUpdate(
          ['updated_at'], // فیلدهایی که باید update بشن
          ['user_id', 'product_id'], // کلیدهای Unique
        )
        .execute();

      // پاک‌سازی آیتم‌های قدیمی
      await this.cleanupOldViews(user.id);

      // بازگشت آیتم ایجاد/به‌روز شده
      return await this.repo.findOne({
        where: { userId: user.id, productId: dto.productId },
        relations: ['product'],
      });
    } catch (error: any) {
      // اگه باز هم Duplicate Entry خورد (بعید!)، ignore کن
      if (error.code === 'ER_DUP_ENTRY') {
        this.logger.debug(
          `Duplicate entry ignored for user ${user.id}, product ${dto.productId}`
        );

        // فقط update کن
        await this.repo.update(
          { userId: user.id, productId: dto.productId },
          { updatedAt: new Date() }
        );

        return await this.repo.findOne({
          where: { userId: user.id, productId: dto.productId },
          relations: ['product'],
        });
      }

      // سایر خطاها رو throw کن
      throw error;
    }
  }

  /**
   * ✅ پاک‌سازی بازدیدهای قدیمی
   * 
   * این کار رو جدا از add انجام میدیم تا سریع‌تر باشه
   */
  private async cleanupOldViews(userId: number): Promise<void> {
    try {
      // ✅ استفاده از Subquery برای پیدا کردن ID های قدیمی
      // MySQL نیاز به LIMIT داره، پس باید با Subquery کار کنیم
      const result = await this.repo.query(
        `
        DELETE FROM recent_views
        WHERE user_id = ?
          AND id NOT IN (
            SELECT id FROM (
              SELECT id
              FROM recent_views
              WHERE user_id = ?
              ORDER BY updated_at DESC
              LIMIT ?
            ) AS keep_ids
          )
        `,
        [userId, userId, this.MAX_VIEWS]
      );

      if (result.affectedRows > 0) {
        this.logger.debug(
          `Cleaned up ${result.affectedRows} old recent views for user ${userId}`
        );
      }
    } catch (error: any) {
      // اگه cleanup با خطا مواجه شد، فقط لاگ کن (مهم نیست)
      this.logger.error(`Failed to cleanup old views for user ${userId}`, error.stack);
    }
  }

  /**
   * دریافت لیست بازدیدهای اخیر
   */
  async getAll(user: RequestUser) {
    const list = await this.repo.find({
      where: { userId: user.id },
      relations: ['product', 'product.mediaPinned'],
      order: { updatedAt: 'DESC' },
      take: this.MAX_VIEWS, // فقط MAX_VIEWS آیتم برگردون
    });

    return RecentViewMapper.toList(list);
  }
}
