import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional } from "class-validator";

export class UpdateSortDto {
    @ApiProperty({ name: 'display_order', required: false, default: null })
    @IsInt()
    @IsOptional()
    displayOrder: number

    @ApiProperty({ name: 'product_id', required: true })
    @IsInt()
    @IsNumber()
    productId: number;
}