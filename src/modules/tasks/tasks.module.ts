import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CardModule } from '../card/card.module';
import { OrderModule } from '../order/order.module';

@Module({
    imports: [
        CardModule, // برای دسترسی به CardStatusService
        OrderModule, // برای دسترسی به OrderPaymentNotificationService
    ],
    providers: [TasksService],
})
export class TasksModule { }
