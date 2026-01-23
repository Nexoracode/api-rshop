import * as crypto from 'crypto';
import * as xmljs from 'xml2js';
import * as forge from 'node-forge';

export class SepidarHellper {
    static getRsaKeyValue(cipherBase64: string, ivBase64: string) {
        const key = Buffer.from('1000bd6a1000bd6a');
        const cypher = Buffer.from(cipherBase64, 'base64');
        const iv = Buffer.from(ivBase64, 'base64');
        const cipherIv = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decripted = cipherIv.update(cypher, undefined, 'utf8');
        decripted += cipherIv.final('utf8')
        // console.log(decripted);
        return decripted;
    }

    static async publicKeyForXml(xml: string) {
        const parser = new xmljs.Parser();
        const result = await parser.parseStringPromise(xml);
        const rsaKey = result.RSAKeyValue;
        return { modulus: rsaKey.Modulus[0], exponent: rsaKey.Exponent[0] };
    }

    static generateEncArbitraryCode(code: string, { modulus, exponent }) {
        console.log(modulus, exponent);
        const modulusBase64 = Buffer.from(modulus, 'base64').toString('hex');
        const exponentBase64 = Buffer.from(exponent, 'base64').toString('hex');
        const n = new forge.jsbn.BigInteger(modulusBase64, 16);
        const e = new forge.jsbn.BigInteger(exponentBase64, 16);
        const publicKey = forge.pki.setRsaPublicKey(n, e);
        const encrypted = publicKey.encrypt(code, 'RSAES-PKCS1-V1_5');
        const encryptedBase64 = Buffer.from(encrypted, 'binary').toString('base64');
        console.log(encryptedBase64);
        return encryptedBase64;
    }
}