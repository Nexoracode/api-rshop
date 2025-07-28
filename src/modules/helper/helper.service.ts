import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HelperEntity } from './entites/helper.entity';
import { Repository } from 'typeorm';
import { CreateHelperDto } from './dto/create-helper.dto';

@Injectable()
export class HelperService {
    constructor(
        @InjectRepository(HelperEntity)
        private readonly helperRepository: Repository<HelperEntity>
    ) { }

    async addHelper(data: CreateHelperDto) {
        const helper = await this.helperRepository.create(data);
        const savedHelper = await this.helperRepository.save(helper);
        return {
            message: 'راهنمای جدید با موفقیت ایجاد شد',
            data: savedHelper
        };
    }
    async getHelper() { }
}
