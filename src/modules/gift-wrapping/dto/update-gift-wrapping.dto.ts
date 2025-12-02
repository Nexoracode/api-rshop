import { PartialType } from '@nestjs/swagger';
import { CreateGiftWrappingDto } from './create-gift-wrapping.dto';

export class UpdateGiftWrappingDto extends PartialType(CreateGiftWrappingDto) {}
