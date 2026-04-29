import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AmadastService {
  constructor() { }
  async getToken() {
    const accessToken = process.env.API_AMADAST;
    const baseUrl = process.env.BASE_URL_AMADAST;
    try {
      const result = await axios.get(`${baseUrl}/stores`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })
      return result.data;
    } catch (e) {
      console.log(`${e.response.data}`);
    }
  }

  async getProvince() {
    const accessToken = process.env.API_AMADAST;
    const baseUrl = process.env.BASE_URL_AMADAST;
    try {
      const result = await axios.get(`${baseUrl}/cities`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })
      return result.data;
    } catch (e) {
      console.log(`${e.response.data}`);
    }
  }

  async getCities(provinceId: string) {
    const accessToken = process.env.API_AMADAST;
    const baseUrl = process.env.BASE_URL_AMADAST;
    try {
      const result = await axios.get(`${baseUrl}/cities?province_id=${provinceId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })
      return result.data;
    } catch (e) {
      console.log(`${e.response.data}`);
    }
  }
}
