import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';


export class CreateInvoiceDto {
    @ApiProperty({ type: 'number', format: 'uuid' })
    @IsUUID()
    orderId: string;
}