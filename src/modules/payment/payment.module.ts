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

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentLog]),
    ScheduleModule.forRoot(),
    PromotionModule, // ✅ اضافه شد
  ],
  controllers: [PaymentController],
  providers: [PaymentService, InvoiceService, IncrementPromotionUsageUseCase],
  exports: [PaymentService],
})
export class PaymentModule { }
