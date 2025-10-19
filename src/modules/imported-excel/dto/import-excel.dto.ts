import { ApiProperty } from "@nestjs/swagger";

export class ImportExcelDto {
    @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
    file: any
}