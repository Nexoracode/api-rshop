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


@Module({
  imports: [
    AppConfigModule,
    UserModule,
    AddressModule,
    AuthModule,
    MediaModule,
    CategoryModule,
    ProductModule,
    CategoryAttributeModule,
    AttributeModule,
    AttributeValueModule,
    AttributeGroupModule,
    VariantAttributeValueModule,
    VariantProductModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
