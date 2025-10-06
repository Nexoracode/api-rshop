import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty } from "class-validator";

export class AddedImportantDto {

    @ApiProperty({ name: 'product_id', type: 'integer', example: 1 })
    @IsInt()
    @IsNotEmpty()
    productId: number;

    @ApiProperty({ name: 'attribute_id', type: 'integer', example: 1 })
    @IsInt()
    @IsNotEmpty()
    attributeId: number;

    @ApiProperty({ example: true, description: 'وضعیت مهم بودن ویژگی' })
    @IsBoolean()
    @IsNotEmpty()
    important: boolean;

}