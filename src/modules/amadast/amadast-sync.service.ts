import axios from 'axios';
import { Repository } from 'typeorm';
import { Province } from '../location/entities/provinces.entity';
import { City } from '../location/entities/cities.entity';
import dataSource from 'db/data-source';
import { InjectRepository } from '@nestjs/typeorm';

interface ApiResponse<T> {
    success: boolean;
    status_code: number;
    message: string;
    data: T;
}

interface ProvinceData {
    id: number;
    title: string;
    parent: number;
    location: string | null;
}

interface CityData {
    id: number;
    title: string;
    parent: number;
    location: string | null;
}

export class SyncService {

    private readonly BASE_URL_AMADAST: string;
    private readonly API_AMADAST: string;
    private readonly REQUEST_DELAY_MS: number;

    constructor(
        @InjectRepository(Province)
        private readonly provinceRepository: Repository<Province>,
        @InjectRepository(City)
        private readonly cityRepository: Repository<City>
    ) {
        this.BASE_URL_AMADAST = process.env.BASE_URL_AMADAST || 'https://shop-integration.amadast.com/v1';
        this.API_AMADAST = process.env.API_AMADAST || '';
        this.REQUEST_DELAY_MS = parseInt(process.env.REQUEST_DELAY_MS || '500');
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async fetchProvinces(): Promise<ProvinceData[]> {
        try {
            console.log('📡 در حال دریافت استان‌ها از API...');
            const response = await axios.get<ApiResponse<ProvinceData[]>>(`${this.BASE_URL_AMADAST}/cities`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.API_AMADAST}`
                }
            });

            if (response.data.success && response.data.data) {
                // فقط استان‌ها رو فیلتر کن (parent === 0)
                const provinces = response.data.data.filter(item => item.parent === 0);
                console.log(`✅ ${provinces.length} استان یافت شد`);
                return provinces;
            } else {
                throw new Error('خطا در دریافت استان‌ها از API');
            }
        } catch (error) {
            console.error('خطا در fetchProvinces:', error);
            throw error;
        }
    }

    private async fetchCitiesByProvinceId(provinceId: number): Promise<CityData[]> {
        try {
            const response = await axios.get<ApiResponse<CityData[]>>(`${this.BASE_URL_AMADAST}/cities`, {
                params: { province_id: provinceId },
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.API_AMADAST}`
                }
            });

            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error(`خطا در دریافت شهرهای استان ${provinceId}:`, error);
            return [];
        }
    }

    private async saveProvince(provinceData: ProvinceData): Promise<Province> {
        let province = await this.provinceRepository.findOne({
            where: { provinceId: provinceData.id }
        });

        if (!province) {
            province = new Province();
        }

        province.provinceId = provinceData.id;
        province.title = provinceData.title;
        province.location = provinceData.location;

        return await this.provinceRepository.save(province);
    }

    private async saveCity(cityData: CityData): Promise<City> {
        let city = await this.cityRepository.findOne({
            where: { cityId: cityData.id }
        });

        if (!city) {
            city = new City();
        }

        city.cityId = cityData.id;
        city.title = cityData.title;
        city.provinceId = cityData.parent;
        city.location = cityData.location;

        return await this.cityRepository.save(city);
    }

    public async syncAllProvincesAndCities(): Promise<{ provincesCount: number; citiesCount: number }> {
        console.log('🔄 شروع فرآیند همگام‌سازی...');
        const startTime = Date.now();

        try {
            // 1. گرفتن همه استان‌ها
            const provinces = await this.fetchProvinces();
            let provincesCount = 0;
            let citiesCount = 0;

            // 2. برای هر استان، شهرهاش رو بگیر و ذخیره کن
            for (let i = 0; i < provinces.length; i++) {
                const province = provinces[i];
                console.log(`\n📌 در حال پردازش استان ${i + 1}/${provinces.length}: ${province.title}`);

                // ذخیره استان
                await this.saveProvince(province);
                provincesCount++;

                // دیلی قبل از درخواست شهرها
                await this.delay(this.REQUEST_DELAY_MS);

                // گرفتن شهرهای استان
                const cities = await this.fetchCitiesByProvinceId(province.id);

                // ذخیره هر شهر
                for (const city of cities) {
                    await this.saveCity(city);
                    citiesCount++;
                }

                console.log(`   ✅ ${cities.length} شهر برای استان ${province.title} ذخیره شد`);

                // دیلی بین استان‌ها (به جز آخرین استان)
                if (i < provinces.length - 1) {
                    await this.delay(this.REQUEST_DELAY_MS);
                }
            }

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`\n🎉 همگام‌سازی با موفقیت انجام شد!`);
            console.log(`📊 خلاصه: ${provincesCount} استان و ${citiesCount} شهر در ${duration} ثانیه ذخیره شدند.`);

            return { provincesCount, citiesCount };
        } catch (error) {
            console.error('❌ خطا در همگام‌سازی:', error);
            throw error;
        }
    }

    public async getProvinceById(provinceId: number): Promise<Province | null> {
        return await this.provinceRepository.findOne({
            where: { provinceId },
            relations: ['cities']
        });
    }

    public async getAllProvinces(): Promise<Province[]> {
        return await this.provinceRepository.find({
            order: { title: 'ASC' }
        });
    }

    public async getCitiesByProvinceId(provinceId: number): Promise<City[]> {
        return await this.cityRepository.find({
            where: { provinceId },
            order: { title: 'ASC' }
        });
    }
}