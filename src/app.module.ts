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
import { CouponModule } from './modules/coupon/coupon.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PaymentLogModule } from './modules/payment/payment-log.module';
import { ImportedExcelModule } from './modules/imported-excel/imported-excel.module';
import { CatalogImportService } from './modules/catalogs/catalog-import.service';


@Module({
  imports: [
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
    CouponModule,
    PaymentModule,
    PaymentLogModule,
    ImportedExcelModule,
  ],
  controllers: [AppController, HelperController],
  providers: [AppService, CatalogImportService],
})
export class AppModule { }