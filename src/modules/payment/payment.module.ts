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
import { CardModule } from '../card/card.module'; // ✅ اضافه شد

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentLog, Order]),
    ScheduleModule.forRoot(),
    PromotionModule,
    MediaModule,     // ✅ برای آپلود رسید
    OrderModule,     // ✅ برای confirmOrderPayment
    CardModule,      // ✅ برای CardStatusService
  ],
  controllers: [
    PaymentController,
    CardToCardController,        // ✅ کاربر
    CardToCardAdminController,   // ✅ ادمین
  ],
  providers: [
    PaymentService,
    InvoiceService,
    IncrementPromotionUsageUseCase,
    CardToCardService,             // ✅ سرویس کارت به کارت
  ],
  exports: [PaymentService, CardToCardService],
})
export class PaymentModule { }
