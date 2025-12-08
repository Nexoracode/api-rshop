import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { UserModule } from './modules/user/user.module';
import { AddressModule } from './modules/address/address.module';
import { AuthModule } from './modules/auth/auth.module';
import { MediaModule } from './modules/media/media.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { CategoryAttributeModule } from './modules/category-attribute/category-attribute.module';
import { AttributeModule } from './modules/attributes/attribute/attribute.module';
import { AttributeValueModule } from './modules/attributes/attribute-value/attribute-value.module';
import { AttributeGroupModule } from './modules/attributes/attribute-group/attribute-group.module';
import { VariantAttributeValueModule } from './modules/attributes/variant-attribute-value/variant-attribute-value.module';
import { VariantProductModule } from './modules/variant-product/variant-product.module';
import { HelperController } from './modules/helper/helper.controller';
import { HelperModule } from './modules/helper/helper.module';
import { BrandModule } from './modules/brand/brand.module';
import { SepidarModule } from './modules/sepidar/sepidar.module';
import { CardModule } from './modules/card/card.module';
import { OrderModule } from './modules/order/order.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { ProductAttributeValueModule } from './modules/product-attribute-value/product-attribute-value.module';
import { CatalogModule } from './modules/catalogs/catalog.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PaymentLogModule } from './modules/payment/payment-log.module';
import { CatalogImportService } from './modules/catalogs/catalog-import.service';
import { ProfileModule } from './modules/profile/profile.module';
import { ReviewModule } from './modules/review/review.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { RecentViewModule } from './modules/recent-view/recent-view.module';
import { SupportModule } from './modules/support/support.module';
import { CompareModule } from './modules/compare/compare.module';
import { OtpModule as OtpModule } from './modules/otps/otps.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { DocsModule } from './docs/docs.module';
import { GiftWrappingModule } from './modules/gift-wrapping/gift-wrapping.module';
import { SettingModule } from './modules/setting/setting.module';
import { SeoModule } from './modules/seo/seo.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { EventEmitterModule } from '@nestjs/event-emitter'; // ✅ اضافه شد
import { HomePageModule } from './modules/home-page/home-page.module';

@Module({
  imports: [
    // ✅ فعال‌سازی Event-Driven Architecture
    EventEmitterModule.forRoot({
      // استفاده از wildcard
      wildcard: false,
      // حداکثر تعداد listener ها
      maxListeners: 10,
      // نمایش warning در صورت memory leak
      verboseMemoryLeak: true,
    }),
    AppConfigModule,
    UserModule,
    AddressModule,
    AuthModule,
    MediaModule,
    CategoryModule,
    CatalogModule,
    ProductModule,
    CategoryAttributeModule,
    AttributeModule,
    AttributeValueModule,
    AttributeGroupModule,
    VariantAttributeValueModule,
    VariantProductModule,
    HelperModule,
    BrandModule,
    SepidarModule,
    CardModule,
    OrderModule,
    InvoiceModule,
    ProductAttributeValueModule,
    PaymentModule,
    PaymentLogModule,
    ProfileModule,
    ReviewModule,
    WishlistModule,
    RecentViewModule,
    SupportModule,
    CompareModule,
    OtpModule,
    PromotionModule,
    DocsModule,
    GiftWrappingModule,
    SettingModule,
    SeoModule,
    AccountingModule, // ✅ ماژول حسابداری
    HomePageModule, // ✅ ماژول مدیریت صفحه اصلی
  ],
  controllers: [AppController, HelperController],
  providers: [AppService, CatalogImportService],
})

export class AppModule { }
