import { PartialType } from '@nestjs/swagger';
import { CreateRecentViewDto } from './create-recent-view.dto';

export class UpdateRecentViewDto extends PartialType(CreateRecentViewDto) {}
