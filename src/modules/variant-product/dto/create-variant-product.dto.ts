import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
class VariantAttributeInput {

    @ApiProperty({ name: 'attribute_id', example: 1, description: 'شناسه ویژگی' })
    @IsInt()
    attributeId: number;

    @ApiProperty({ type: 'array', name: 'value_ids', example: [1, 2] })
    @IsArray()
    @IsInt({ each: true })
    valueIds: number[];
}
export class CreateVariantProductDto {

    @ApiProperty({ name: 'product_id', default: 1 })
    @IsInt()
    productId: number;

    @ApiProperty({
        default: "DP-4e34",
        type: 'string'
    })
    @IsString()
    @IsNotEmpty()
    sku: string;

    @ApiProperty({
        type: 'integer',
        example: '200000'
    })
    @IsInt()
    @Min(0)
    price: number;

    @ApiProperty({ name: 'discount_amount', default: 0 })
    @IsOptional()
    @IsNumber()
    discountAmount?: number;

    @ApiProperty({ name: 'discount_percent', default: 0 })
    @IsOptional()
    @IsNumber()
    discountPercent?: number;

    @ApiProperty()
    @IsInt()
    @Min(0)
    stock: number;

    @ApiProperty({
        type: [VariantAttributeInput],
        description: 'لیست ویژگی‌ها و مقدارها',
        example: [
            { attribute_id: 1, value_ids: [] },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantAttributeInput)
    attributes: VariantAttributeInput[];
}
