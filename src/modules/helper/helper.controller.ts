import { Body, Controller, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { HelperService } from './helper.service';
import { CreateHelperDto } from './dto/create-helper.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('10 - 🆘 Helpers')
@Controller('helpers')
export class HelperController {
    constructor(
        private readonly helperService: HelperService
    ) { }

    @Post()
    addHelper(@Body() data: CreateHelperDto) {
        return this.helperService.addHelper(data);
    }

    @Patch(':id')
    updateHelper(@Param('id', ParseIntPipe) id: number, @Body() data: CreateHelperDto) {
        return this.helperService.updateHelper(id, data);
    }
}
