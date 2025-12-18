import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentLog } from './entities/payment-logs.entity';
import { InvoiceService } from '../invoice/invoice.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentRecoveryService } from './payment-recovery.service';
import { PromotionModule } from '../promotion/promotion.module';
import { IncrementPromotionUsageUseCase } from '../promotion/application/usecases/increment-promotion-usage.usecase';
import { CardToCardService } from './card-to-card.service';
import { CardToCardController } from './card-to-card.controller';
import { CardToCardAdminController } from './card-to-card-admin.controller';
import { MediaModule } from '../media/media.module';
import { OrderModule } from '../order/order.module';
import { Order } from '../order/entities/order.entity';
import { CardModule } from '../card/card.module';
import { SettingModule } from '../setting/setting.module';
import { CardService } from '../card/card.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentLog, Order]),
    ScheduleModule.forRoot(),
    PromotionModule,
    MediaModule,
    OrderModule,
    CardModule,
    SettingModule,
    CardModule,
    // ✅ نیازی به import AccountingModule نیست - EventEmitter خودش handle می‌کنه
  ],
  controllers: [
    PaymentController,
    CardToCardController,
    CardToCardAdminController,
  ],
  providers: [
    PaymentService,
    InvoiceService,
    IncrementPromotionUsageUseCase,
    CardToCardService,
    PaymentRecoveryService, // ✅ اضافه شد
  ],
  exports: [PaymentService, CardToCardService],
})
export class PaymentModule { }
