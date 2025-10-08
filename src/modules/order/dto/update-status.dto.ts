import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "../entities/order.entity";
import { IsEnum, IsNotEmpty } from "class-validator";

export class UpdateStatusDto {

    @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
    @IsEnum(OrderStatus)
    @IsNotEmpty()
    status: OrderStatus;
}