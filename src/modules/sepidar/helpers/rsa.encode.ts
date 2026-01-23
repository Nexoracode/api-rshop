// services/rpc-auth.service.ts
import * as forge from 'node-forge';
import * as xml2js from 'xml2js';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class RpcAuthService {
    async generateEncryptedCode(xmlPublicKey: string): Promise<string> {
        // 1. تحلیل XML برای استخراج modulus و exponent
        const parser = new xml2js.Parser();
        let parsedXml: any;
        try {
            parsedXml = await parser.parseStringPromise(xmlPublicKey);
        } catch (error) {
            throw new Error('خطا در تحلیل XML کلید عمومی: ' + error.message);
        }
        // 2. استخراج modulus و exponent
        const modulusBase64 = parsedXml.RSAKeyValue.Modulus[0];
        const exponentBase64 = parsedXml.RSAKeyValue.Exponent[0];
        // 3. تبدیل به بایت‌ها
        const modulus = forge.util.decode64(modulusBase64);
        const exponent = forge.util.decode64(exponentBase64);
        // 5. تولید arbitraryCode (UUID)
        const arbitraryCode = uuidv4();
        // 6. رمزنگاری با RSA-PKCS#1 v1.5
        const publicKey = forge.pki.publicKeyFromPem(`
            -----BEGIN PUBLIC KEY-----
            ${Buffer.from(modulus, 'base64').toString('base64')}
            ${Buffer.from(exponent, 'base64').toString('base64')}
            -----END PUBLIC KEY-----
        `);
        const encrypted = publicKey.encrypt(arbitraryCode, 'RSAES-PKCS1-V1_5');
        // 8. بازگرداندن نتیجه
        return Buffer.from(encrypted).toString('base64');
    }
}

// -----BEGIN PUBLIC KEY-----
// MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5xeqN+wBg9kL0siPSzviV7bZ
// dyCrKa4xecukOofux/qNf8r3/UcDSLrojBNy7Ef6yX7u//sbYGML+bx2ylHFQ==
// -----END PUBLIC KEY-----