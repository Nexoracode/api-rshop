import { IsInt, IsUUID, Min } from 'class-validator';


export class UpdateItemDto {
    @IsUUID()
    itemId: string;


    @IsInt()
    @Min(0)
    quantity: number; // اگر 0 شود، سطر حذف می‌شود
}