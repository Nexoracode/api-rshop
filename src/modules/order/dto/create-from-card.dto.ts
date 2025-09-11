import { IsOptional, IsString } from 'class-validator';


export class CreateOrderFromCardDto {
    @IsOptional()
    @IsString()
    note?: string;
}