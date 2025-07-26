import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from "class-validator";

class VariantAttributeInput {

    @ApiProperty({ name: 'attribute_id', example: 1, description: 'شناسه ویژگی' })
    @IsInt()
    attributeId: number;

    @ApiProperty({ name: 'value_id', example: 1, description: 'شناسه مقدار ویژگی' })
    @IsInt()
    valueId: number;

    @ApiProperty({ example: 'آبی', description: 'برچسب نمایشی مقدار ویژگی' })
    @IsString()
    label: string;
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

    @ApiProperty()
    @IsInt()
    @Min(0)
    stock: number;

    @ApiProperty({
        type: [VariantAttributeInput],
        description: 'لیست ویژگی‌ها و مقدارها',
        example: [
            { attribute_id: 1, value_id: 1, label: 'آبی' },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantAttributeInput)
    attributes: VariantAttributeInput[];
}
