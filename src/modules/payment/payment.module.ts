import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { InvoiceModule } from '../invoice/invoice.module';
import { PaymentLogModule } from './payment-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), InvoiceModule, PaymentLogModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule { }
