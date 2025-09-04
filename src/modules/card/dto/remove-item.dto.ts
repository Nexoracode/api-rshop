import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';


export class RemoveItemDto {

    @ApiProperty({ type: 'number', format: 'uuid' })
    @IsUUID()
    itemId: string;
}