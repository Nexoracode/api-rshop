import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingCategory } from './enums/setting-category.enum';
import { EventEmitter2 } from '@nestjs/event-emitter'; // ✅ اضافه شد
import { SettingUpdatedEvent } from './events/setting-updated.event'; // ✅ اضافه شد

@Injectable()
export class SettingService {
    constructor(
        @InjectRepository(Setting)
        private readonly settingRepo: Repository<Setting>,
        private readonly eventEmitter: EventEmitter2, // ✅ اضافه شد
    ) { }

    async findAll(): Promise<Setting[]> {
        return await this.settingRepo.find({
            order: { category: 'ASC', key: 'ASC' }
        });
    }

    async findByCategory(category: SettingCategory): Promise<Setting[]> {
        return await this.settingRepo.find({
            where: { category },
            order: { key: 'ASC' }
        });
    }

    async findByKey(key: string): Promise<Setting | null> {
        return await this.settingRepo.findOne({ where: { key } });
    }

    async getValue(key: string): Promise<string | null> {
        const setting = await this.findByKey(key);
        return setting ? setting.value : null;
    }

    async getValueOrDefault(key: string, defaultValue: string): Promise<string> {
        const value = await this.getValue(key);
        return value !== null ? value : defaultValue;
    }

    async upsert(dto: UpdateSettingDto): Promise<Setting> {
        let setting = await this.findByKey(dto.key);
        const oldValue = setting?.value; // ✅ ذخیره مقدار قدیمی

        if (setting) {
            setting.value = dto.value;
            if (dto.description !== undefined) {
                setting.description = dto.description;
            }
            if (dto.category !== undefined) {
                setting.category = dto.category;
            }
        } else {
            setting = this.settingRepo.create({
                key: dto.key,
                value: dto.value,
                description: dto.description || null,
                category: dto.category || SettingCategory.GENERAL,
            });
        }

        const savedSetting = await this.settingRepo.save(setting);

        // ✅ Emit event برای cache invalidation
        if (oldValue !== dto.value) {
            this.eventEmitter.emit(
                'setting.updated',
                new SettingUpdatedEvent(dto.key, oldValue || '', dto.value)
            );
        }

        return savedSetting;
    }

    async bulkUpsert(settings: UpdateSettingDto[]): Promise<Setting[]> {
        const results: Setting[] = [];

        for (const dto of settings) {
            const result = await this.upsert(dto);
            results.push(result);
        }

        return results;
    }

    async remove(key: string): Promise<void> {
        const setting = await this.findByKey(key);
        if (!setting) {
            throw new NotFoundException(`تنظیم با کلید ${key} یافت نشد`);
        }
        await this.settingRepo.remove(setting);
    }

    async getCardToCardSettings() {
        const cardNumber = await this.getValue('shop_card_number');
        const cardHolder = await this.getValue('shop_card_holder');
        const bankName = await this.getValue('shop_bank_name');
        const iban = await this.getValue('shop_iban');

        return {
            cardNumber: cardNumber || null,
            cardHolder: cardHolder || null,
            bankName: bankName || null,
            iban: iban || null,
        };
    }
}
