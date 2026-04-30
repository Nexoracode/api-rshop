import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AmadastService {
  private readonly logger = new Logger(AmadastService.name);
  private readonly accessToken = process.env.API_AMADAST;
  private readonly baseUrl = process.env.BASE_URL_AMADAST;
  constructor() { }
  async getToken() {
    try {
      const result = await axios.get(`${this.baseUrl}/stores`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      })
      return result.data;
    } catch (e: any) {
      this.logger.error(`${e}`);
    }
  }

  async getProvince() {
    try {
      const result = await axios.get(`${this.baseUrl}/cities`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      })
      return result.data;
    } catch (e: any) {
      this.logger.error(`${e}`);
    }
  }

  async getCities(provinceId: string) {
    try {
      const result = await axios.get(`${this.baseUrl}/cities?province_id=${provinceId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      })
      return result.data;
    } catch (e: any) {
      this.logger.error(`${e}`);
    }
  }

  async createOrder() {
    const data = {
      "store_id": 84743,
      "external_order_id": 5,
      "recipient_name": "محمد مداحی",
      "sender_name": "مصطفی فراهی",
      "recipient_mobile": "09150553208",
      "sender_mobile": "09150553208",
      "recipient_city_id": 522,
      "recipient_address": "مطهری شمال ، بلوار کریمی 26، پلاک 131/1، واحد4",
      "weight": 235,
      "value": 15000,
      "product_type": 1,
      "package_type": 0,
      "packing_id": "string",
      "products": [
        {
          "external_product_id": 1,
          "price": 15000,
          "quantity": 1,
          "weight": 235,
          "title": "کالا جهت تست"
        }
      ],
      "recipient_postal_code": "9152356215",
      "description": "لطفا خیلی مراقب باشین، کادوی تولده",
      "is_breakable": false,
      "is_liquid": false,
      "is_big": false
    };

    try {
      // ✅ روش صحیح (headers به عنوان پارامتر سوم)
      const result = await axios.post(
        `${this.baseUrl}/orders`,  // پارامتر اول: URL
        data,                       // پارامتر دوم: Body (خود data، بدون JSON.stringify)
        {                           // پارامتر سوم: Config (headers اینجا قرار میگیره)
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      console.log(result.data);
      return result.data;
    } catch (e: any) {
      this.logger.error(`Error: ${e.message}`);
      // برای لاگ کردن جزئیات بیشتر خطا:
      if (e.response) {
        this.logger.error(`Status: ${e.response.status}`);
        this.logger.error(`Data: ${JSON.stringify(e.response.data)}`);
      }
      throw e;
    }
  }
}
