// src/modules/order/dto/create-manual-order.dto.ts

import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { OrderStatus } from "../enums/order-status.enum";
import { ApiProperty } from "@nestjs/swagger";

class ManualOrderItemDto {

    @ApiProperty({ name: 'product_id', example: 1 })
    @IsInt()
    productId: number;

    @ApiProperty({ name: 'variant_id', example: null })
    @IsOptional()
    @IsInt()
    variantId?: number;

    @ApiProperty({ example: 1 })
    @IsNumber()
    quantity: number;
}

export class CreateManualOrderDto {

    @ApiProperty({ name: 'user_id', example: 2 })
    @IsInt()
    userId: number;
    @ApiProperty({
        type: 'array', example: [
            { product_id: 1, variant_id: null, quantity: 50 },
            { product_id: 2, variant_id: 1, quantity: 1 },
        ]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ManualOrderItemDto)
    items: ManualOrderItemDto[];

    @ApiProperty({ enum: OrderStatus, default: OrderStatus.PENDING })
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @ApiProperty({ name: 'discount_amount', type: 'number', example: 2000 })
    @IsOptional()
    @IsNumber()
    discountAmount?: number;

    @ApiProperty({ name: 'is_manual', default: true })
    @IsOptional()
    @IsBoolean()
    isManual?: boolean = true; // پیش‌فرض دستی
}
