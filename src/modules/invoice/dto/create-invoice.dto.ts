import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';


export class CreateInvoiceDto {
    @ApiProperty({ type: 'number' })
    @IsInt()
    orderId: string;
}