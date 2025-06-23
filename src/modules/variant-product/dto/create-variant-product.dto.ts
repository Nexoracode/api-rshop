import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from "class-validator";

class VariantAttributeInput {

    @ApiProperty({ example: 2, description: 'شناسه ویژگی' })
    @IsInt()
    attributeId: number;

    @ApiProperty({ example: 5, description: 'شناسه مقدار ویژگی' })
    @IsInt()
    valueId: number;

    @ApiProperty({ example: 'قرمز', description: 'برچسب نمایشی مقدار ویژگی' })
    @IsString()
    label: string;
}
export class CreateVariantProductDto {

    @ApiProperty()
    @IsInt()
    productId: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    sku: string;

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
            { attributeId: 2, valueId: 5, label: 'قرمز' },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantAttributeInput)
    attributes: VariantAttributeInput[];
}
