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

// Online Payment Handlers
import {
  FailedPaymentHandler,
  PaymentCreationHandler,
  PaymentVerificationHandler,
  SuccessfulPaymentHandler,
  UserCancellationHandler,
} from './handlers';

// Card-to-Card Handlers
import { CardToCardInitiationHandler } from './handlers/card-to-card/card-to-card-initiation.handler';
import { CardToCardUploadReceiptHandler } from './handlers/card-to-card/card-to-card-upload-receipt.handler';
import { CardToCardRejectionHandler } from './handlers/card-to-card/card-to-card-rejection.handler';
import { CardToCardApprovalHandler } from './handlers/card-to-card/card-to-card-approval.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentLog, Order]),
    PromotionModule,
    MediaModule,
    OrderModule,
    CardModule,
    SettingModule,
  ],
  controllers: [
    PaymentController,
    CardToCardController,
    CardToCardAdminController,
  ],
  providers: [
    // Services
    PaymentService,
    InvoiceService,
    IncrementPromotionUsageUseCase,
    CardToCardService,
    PaymentRecoveryService,

    // Online Payment Handlers
    PaymentCreationHandler,
    PaymentVerificationHandler,
    UserCancellationHandler,
    SuccessfulPaymentHandler,
    FailedPaymentHandler,

    // Card-to-Card Handlers
    CardToCardInitiationHandler,
    CardToCardUploadReceiptHandler,
    CardToCardRejectionHandler,
    CardToCardApprovalHandler,
  ],
  exports: [PaymentService, CardToCardService],
})
export class PaymentModule {}
