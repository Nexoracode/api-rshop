import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ImportedExcelService } from './imported-excel.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ImportExcelDto } from './dto/import-excel.dto';
import * as XLSX from 'xlsx';
import { ExcelRow } from './types/imported.type';

@Controller('imported-excel')
export class ImportedExcelController {
  constructor(private readonly importedExcelService: ImportedExcelService) { }

  @ApiBody({
    description: 'imported excel file',
    type: ImportExcelDto
  })
  @Post('import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { dest: './uploads' }))
  async uploadAndImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error("فایل اکسل ارسال نشده است.");

    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

    // حالا jsonData شامل آرایه‌ای از ردیف‌هاست با فیلدهای فارسی
    return this.importedExcelService.importFromExcel(rows)
  }
}
