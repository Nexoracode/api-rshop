import { PartialType } from '@nestjs/swagger';
import { CreateSepidarDto } from './create-sepidar.dto';

export class UpdateSepidarDto extends PartialType(CreateSepidarDto) {}
