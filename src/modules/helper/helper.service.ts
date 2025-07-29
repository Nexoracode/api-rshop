import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HelperEntity } from './entities/helper.entity';
import { Repository } from 'typeorm';
import { CreateHelperDto } from './dto/create-helper.dto';
import { UpdateHelperDto } from './dto/update-helper.dto';
import { HelperMapper } from './mappers/helper.mapper';

@Injectable()
export class HelperService {
    constructor(
        @InjectRepository(HelperEntity)
        private readonly helperRepository: Repository<HelperEntity>
    ) { }

    async addHelper(data: CreateHelperDto) {
        const helper = await this.helperRepository.create(data);
        const savedHelper = await this.helperRepository.save(helper);
        const result = await this.helperRepository.findOneBy({ id: savedHelper.id });
        if (!result) throw new NotFoundException('راهنما یافت نشد');
        return HelperMapper.toResponse(result);
    }

    async updateHelper(id: number, data: UpdateHelperDto) {
        const helper = await this.helperRepository.findOneBy({ id });
        if (!helper) throw new NotFoundException('راهنما یافت نشد');
        const updateHelper = await this.helperRepository.merge(helper, data);
        const result = await this.helperRepository.findOneBy({ id: updateHelper.id });
        if (!result) throw new NotFoundException('راهنما یافت نشد');
        return HelperMapper.toResponse(updateHelper);
    }
}
