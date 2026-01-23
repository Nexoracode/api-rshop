// auth.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SepidarHellper } from './helpers/sepidar.helper';
import * as crypto from 'crypto';
import axios from 'axios';
import { LoginSepidarDto } from './dto/login-sepidar.dto';

@Injectable()
export class SepidarService {
  private serial = process.env.SEPIDAR_SERIAL as string;
  private chiper = process.env.SEPIDAR_CYPHER as string;
  private iv = process.env.SEPIDAR_IV as string;
  private username = process.env.SEPIDAR_USERNAME as string;
  private password = process.env.SEPIDAR_PASSWORD as string;
  constructor() { }

  async register() {
    const url = 'https://sepidar.roohbakhshac.ir/api/Devices/Register';
    const integrationID = this.serial.match(/\d{4}/)?.[0] ?? "";
    const key = Buffer.from(this.serial + this.serial);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encrypted = cipher.update(integrationID, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const result = {
      Cypher: encrypted,
      IV: iv.toString('base64'),
      IntegrationID: integrationID,
    };
    try {
      const response = await axios.post(url, result);
      return response.data;
    } catch (e) {
      throw new BadRequestException(e.response.data.Message);
    }
  }

  async login() {
    const url = 'https://sepidar.roohbakhshac.ir/api/users/login';
    const arbitraryCode = uuidv4();
    const RsaKey = SepidarHellper.getRsaKeyValue(this.chiper, this.iv);
    const publicKey = await SepidarHellper.publicKeyForXml(RsaKey);
    const encArbitraryCode = SepidarHellper.generateEncArbitraryCode(arbitraryCode, publicKey);
    const passwordHash = crypto.hash('md5', this.password);
    const integrationId = '1000';
    const generationVersion = '110';
    const data = {
      username: this.username,
      passwordHash,
    };
    const headers = {
      generationVersion,
      integrationId,
      arbitraryCode,
      encArbitraryCode: encArbitraryCode,
    }
    try {
      const response = await axios.post(url, JSON.stringify(data), { headers })
      console.log(response.data);
      return response.data;
    } catch (e) {
      console.log(e.response.data, e.response.status)
      throw new BadRequestException(e.response.data.Message);
    }
  }
}
