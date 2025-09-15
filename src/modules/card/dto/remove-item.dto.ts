import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID } from 'class-validator';


export class RemoveItemDto {

    @ApiProperty({ type: 'number' })
    @IsInt()
    itemId: string;
}