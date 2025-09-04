import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsUUID, Min } from "class-validator";

export class AddItemDto {

    @ApiProperty({ type: 'number', example: 1 })
    @IsInt()
    productId: number;


    @ApiProperty({ type: 'number', example: 1, required: false })
    @IsOptional()
    @IsInt()
    variantId?: number;

    @ApiProperty({ type: 'number', example: 1, minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;
}