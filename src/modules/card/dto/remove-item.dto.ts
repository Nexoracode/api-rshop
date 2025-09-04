import { IsUUID } from 'class-validator';


export class RemoveItemDto {
    @IsUUID()
    itemId: string;
}