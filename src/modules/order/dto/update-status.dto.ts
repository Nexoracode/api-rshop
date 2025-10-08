import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { OrderStatus } from "../enums/order-status.enum";

export class UpdateStatusDto {

    @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
    @IsEnum(OrderStatus)
    @IsNotEmpty()
    status: OrderStatus;
}