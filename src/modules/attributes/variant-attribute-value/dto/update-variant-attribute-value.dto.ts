import { PartialType } from '@nestjs/mapped-types';
import { CreateVariantAttributeValueDto } from './create-variant-attribute-value.dto';

export class UpdateVariantAttributeValueDto extends PartialType(CreateVariantAttributeValueDto) { }
