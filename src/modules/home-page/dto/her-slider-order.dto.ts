import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class HeroSliderOrder {
    @ApiProperty({ name: 'display_order', example: 1 })
    @IsNotEmpty()
    @IsNumber()
    displayOrder: number;
}