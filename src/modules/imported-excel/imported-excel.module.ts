import { Module } from '@nestjs/common';
import { ImportedExcelService } from './imported-excel.service';
import { ImportedExcelController } from './imported-excel.controller';

@Module({
  controllers: [ImportedExcelController],
  providers: [ImportedExcelService],
})
export class ImportedExcelModule {}
