import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateReviewStatusDto {
    @ApiProperty({ example: true })
    @IsBoolean()
    isApproved: boolean;
}
