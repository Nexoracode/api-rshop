import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "src/modules/user/entities/user.entity";
import { Product } from "src/modules/product/entities/product.entity";
import { Category } from "src/modules/category/entities/category.entity";

export enum CouponType {
    PERCENT = "percent",
    FIXED = "fixed",
}

@Entity("coupons")
export class Coupon {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string; // مثل: WELCOME10 یا NOWROOZ1404

    @Column({ type: "enum", enum: CouponType, default: CouponType.PERCENT })
    type: CouponType;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number; // مقدار تخفیف (درصد یا مبلغ)

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    minOrderAmount?: number; // حداقل مبلغ خرید برای فعال‌سازی

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    maxDiscountAmount?: number; // سقف تخفیف (در درصدی‌ها)

    @Column({ type: "datetime", nullable: true })
    startDate?: Date;

    @Column({ type: "datetime", nullable: true })
    endDate?: Date;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    usageLimit?: number; // محدودیت کل استفاده از کوپن

    @Column({ default: 0 })
    useCount: number; // تعداد استفاده فعلی

    @Column({ default: false })
    forFirstOrder: boolean; // مخصوص اولین خرید

    // --- روابط ---
    @ManyToMany(() => User, { nullable: true })
    @JoinTable({
        name: "coupon_users",
        joinColumn: { name: "coupon_id" },
        inverseJoinColumn: { name: "user_id" },
    })
    allowedUsers?: User[];

    @ManyToMany(() => Product, { nullable: true })
    @JoinTable({
        name: "coupon_products",
        joinColumn: { name: "coupon_id" },
        inverseJoinColumn: { name: "product_id" },
    })
    allowedProducts?: Product[];

    @ManyToMany(() => Category, { nullable: true })
    @JoinTable({
        name: "coupon_categories",
        joinColumn: { name: "coupon_id" },
        inverseJoinColumn: { name: "category_id" },
    })
    allowedCategories?: Category[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
