import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateSettingDto } from './update-setting.dto';

export class BulkUpdateSettingsDto {
    @ApiProperty({ 
        description: 'لیست تنظیمات',
        type: [UpdateSettingDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateSettingDto)
    settings: UpdateSettingDto[];
}
