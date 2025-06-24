import { PartialType } from '@nestjs/swagger';
import { CreateAttributeGroupDto } from './create-attribute-group.dto';

export class UpdateAttributeGroupDto extends PartialType(CreateAttributeGroupDto) { }
