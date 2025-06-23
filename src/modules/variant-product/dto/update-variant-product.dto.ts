import { PartialType } from '@nestjs/swagger';
import { CreateVariantProductDto } from './create-variant-product.dto';

export class UpdateVariantProductDto extends PartialType(CreateVariantProductDto) { }
