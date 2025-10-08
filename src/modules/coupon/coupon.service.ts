import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, In } from "typeorm";

import { Coupon, CouponType } from "./entities/coupon.entity";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";
import { ApplyCouponDto } from "./dto/apply-coupon.dto";

import { User } from "src/modules/user/entities/user.entity";
import { Product } from "src/modules/product/entities/product.entity";
import { Category } from "src/modules/category/entities/category.entity";
import { runInTransaction } from "src/common/helpers/transaction.helper";

@Injectable()
export class CouponService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) { }

  // 🟢 ایجاد کد تخفیف جدید
  async create(dto: CreateCouponDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const exists = await manager.findOne(Coupon, {
        where: { code: dto.code },
      });
      if (exists) throw new BadRequestException("کد تخفیف تکراری است.");

      const coupon = manager.create(Coupon, {
        ...dto,
      });

      // روابط اختیاری
      if (dto.allowedUserIds?.length) {
        coupon.allowedUsers = await manager.find(User, {
          where: { id: In(dto.allowedUserIds) },
        });
      }

      if (dto.allowedProductIds?.length) {
        coupon.allowedProducts = await manager.find(Product, {
          where: { id: In(dto.allowedProductIds) },
        });
      }

      if (dto.allowedCategoryIds?.length) {
        coupon.allowedCategories = await manager.find(Category, {
          where: { id: In(dto.allowedCategoryIds) },
        });
      }

      return manager.save(Coupon, coupon);
    });
  }

  // 🟠 بروزرسانی
  async update(id: number, dto: UpdateCouponDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const coupon = await manager.findOne(Coupon, {
        where: { id },
        relations: ["allowedUsers", "allowedProducts", "allowedCategories"],
      });
      if (!coupon) throw new NotFoundException("کد تخفیف یافت نشد.");

      Object.assign(coupon, dto);

      if (dto.allowedUserIds) {
        coupon.allowedUsers = await manager.find(User, {
          where: { id: In(dto.allowedUserIds) },
        });
      }

      if (dto.allowedProductIds) {
        coupon.allowedProducts = await manager.find(Product, {
          where: { id: In(dto.allowedProductIds) },
        });
      }

      if (dto.allowedCategoryIds) {
        coupon.allowedCategories = await manager.find(Category, {
          where: { id: In(dto.allowedCategoryIds) },
        });
      }

      return manager.save(Coupon, coupon);
    });
  }

  // 🔵 اعمال و بررسی کد تخفیف
  async apply(dto: ApplyCouponDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const coupon = await manager.findOne(Coupon, {
        where: { code: dto.code, isActive: true },
        relations: ["allowedUsers", "allowedProducts", "allowedCategories"],
      });

      if (!coupon) throw new NotFoundException("کد تخفیف نامعتبر است.");

      const now = new Date();
      if (coupon.startDate && coupon.startDate > now)
        throw new BadRequestException("کد هنوز فعال نشده است.");
      if (coupon.endDate && coupon.endDate < now)
        throw new BadRequestException("کد تخفیف منقضی شده است.");

      if (coupon.usageLimit && coupon.useCount >= coupon.usageLimit)
        throw new BadRequestException("ظرفیت استفاده از کد به پایان رسیده است.");

      // بررسی حداقل مبلغ سفارش
      if (coupon.minOrderAmount && dto.totalAmount < coupon.minOrderAmount)
        throw new BadRequestException("حداقل مبلغ خرید برای این کد رعایت نشده است.");

      // بررسی اولین خرید
      if (coupon.forFirstOrder) {
        const orderCount = await manager.countBy(User, { id: dto.userId });
        if (orderCount > 0)
          throw new BadRequestException("این کد فقط برای اولین خرید قابل استفاده است.");
      }

      // بررسی اینکه کاربر مجاز هست یا نه
      if (
        coupon.allowedUsers?.length &&
        !coupon.allowedUsers.some((u) => u.id === dto.userId)
      ) {
        throw new BadRequestException("شما مجاز به استفاده از این کد نیستید.");
      }

      // ✅ محاسبه تخفیف
      let discount = 0;
      if (coupon.type === CouponType.PERCENT) {
        discount = (dto.totalAmount * coupon.amount) / 100;
        if (coupon.maxDiscountAmount)
          discount = Math.min(discount, coupon.maxDiscountAmount);
      } else {
        discount = coupon.amount;
      }

      const payable = Math.max(dto.totalAmount - discount, 0);

      // افزایش شمارنده استفاده
      coupon.useCount += 1;
      await manager.save(Coupon, coupon);

      return {
        couponCode: coupon.code,
        discount,
        payable,
      };
    });
  }

  // 🔍 لیست همه کدها
  async findAll() {
    return this.dataSource.getRepository(Coupon).find({
      relations: ["allowedUsers", "allowedProducts", "allowedCategories"],
      order: { createdAt: "DESC" },
    });
  }

  // 🔍 دریافت یک کد خاص
  async findOne(id: number) {
    const repo = this.dataSource.getRepository(Coupon);
    const coupon = await repo.findOne({
      where: { id },
      relations: ["allowedUsers", "allowedProducts", "allowedCategories"],
    });
    if (!coupon) throw new NotFoundException("کد یافت نشد.");
    return coupon;
  }

  // 🔴 حذف
  async remove(id: number) {
    return runInTransaction(this.dataSource, async (manager) => {
      const coupon = await manager.findOne(Coupon, { where: { id } });
      if (!coupon) throw new NotFoundException("کد یافت نشد.");
      await manager.remove(Coupon, coupon);
      return { success: true };
    });
  }
}
