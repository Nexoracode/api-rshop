import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentLogService } from "./payment-log.service";
import { PaymentLogController } from "./payment-log.controller";
import { PaymentLog } from "./entities/payment-logs.entity";

@Module({
    imports: [TypeOrmModule.forFeature([PaymentLog])],
    providers: [PaymentLogService],
    controllers: [PaymentLogController],
    exports: [PaymentLogService],
})
export class PaymentLogModule { }
