import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SupportStatus } from '../entities/support.entity';

export class UpdateSupportStatusDto {
    @ApiProperty({ enum: SupportStatus })
    @IsEnum(SupportStatus)
    status: SupportStatus;
}
