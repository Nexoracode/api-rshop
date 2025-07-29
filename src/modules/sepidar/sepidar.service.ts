// auth.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as xml2js from 'xml2js';
import * as forge from 'node-forge';
import { v4 as uuidv4 } from 'uuid';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SepidarService {
  constructor(private readonly httpService: HttpService) { }

  async register(): Promise<Object> {
    const serial = "100000d8";
    const integrationID = serial.match(/\d{4}/)?.[0] ?? ""; // = "1000"
    const key = Buffer.from(serial + serial); // 32 bytes for AES-256
    const iv = crypto.randomBytes(16); // 16 bytes for AES block size

    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encrypted = cipher.update(integrationID, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const result = {
      Cypher: encrypted,
      IV: iv.toString('base64'),
      integrationID: integrationID,
    };


    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          'https://sepidar.roohbakhshac.ir/api/Devices/Register', result),
      );
      console.log(data);
      return {
        message: 'سپیدار',
        data: data,
      }
    } catch (e) {
      console.error('Error in sepidar:', e);
      throw new BadRequestException('خطا در ارتباط با Sepidar');
    }
  }

  // رمزگشایی کلید عمومی RSA که از مرحله Register اومده
  private decryptPublicKey(encryptedBase64: string, ivBase64: string, serial: string): string {
    const key = Buffer.from(serial + serial); // 16 bytes for AES-128
    const iv = Buffer.from(ivBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');

    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted; // خروجی XML کلید عمومی
  }

  // استخراج Modulus و Exponent از XML
  private async parsePublicKeyXml(xml: string): Promise<{ modulus: string; exponent: string }> {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);
    const rsaKey = result.RSAKeyValue;
    return {
      modulus: rsaKey.Modulus[0],
      exponent: rsaKey.Exponent[0],
    };
  }

  // رمزنگاری ArbitraryCode با کلید عمومی RSA
  private async encryptArbitraryCode(xml: string, arbitraryCode: string): Promise<string> {
    const { modulus, exponent } = await this.parsePublicKeyXml(xml);

    const rsa = forge.pki.setRsaPublicKey(
      new forge.jsbn.BigInteger(Buffer.from(modulus, 'base64').toString('hex'), 16),
      new forge.jsbn.BigInteger(Buffer.from(exponent, 'base64').toString('hex'), 16),
    );

    const encrypted = rsa.encrypt(arbitraryCode, 'RSAES-PKCS1-V1_5');
    return Buffer.from(encrypted, 'binary').toString('base64');
  }

  async login() {
    const serial = process.env.SEPIDAR_SERIAL || "100000d8";
    const cypher = process.env.SEPIDAR_CYPHER || "your-cypher";
    const iv = process.env.SEPIDAR_IV || "your-iv";
    const username = process.env.SEPIDAR_USERNAME || "your-username";
    const password = process.env.SEPIDAR_PASSWORD || "your-password";
    const integrationId = serial.match(/\d{4}/)?.[0] ?? '';
    const generationVersion = '6.0.1';
    const arbitraryCode = uuidv4();
    const publicKeyXml = this.decryptPublicKey(cypher, iv, serial);
    const encArbitraryCode = await this.encryptArbitraryCode(publicKeyXml, arbitraryCode);
    const passwordHash = crypto.createHash('md5').update(password).digest('hex');
    const headers = {
      GenerationVersion: generationVersion,
      IntegrationID: integrationId,
      ArbitraryCode: arbitraryCode,
      EncArbitraryCode: encArbitraryCode,
    };

    const body = {
      UserName: username,
      PasswordHash: passwordHash,
    };

    const { data } = await firstValueFrom(
      this.httpService.post(
        'https://sepidar.roohbakhshac.ir/api/users/login',
        body,
        { headers },
      ),
    );

    return {
      message: 'ورود به سپیدار موفقیت آمیز بود',
      data,
    };
  }
}
