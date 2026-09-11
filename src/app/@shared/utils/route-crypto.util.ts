const CryptoJS: any = require('crypto-js');

const FORMAT_VERSION = 'v2';
const KEY_SIZE_WORDS = 256 / 32;
const IV_SIZE_WORDS = 128 / 32;
const PBKDF2_ITERATIONS = 120000;

export function encryptRoutePayload(value: string, secret: string): string {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(IV_SIZE_WORDS * 4);
  const key = deriveKey(secret, salt);
  const encrypted = CryptoJS.AES.encrypt(value, key, { iv });
  return [FORMAT_VERSION, encodeWordArray(salt), encodeWordArray(iv), encodeWordArray(encrypted.ciphertext)].join(':');
}

export function decryptRoutePayload(value: string, secret: string): string {
  if (value?.startsWith(`${FORMAT_VERSION}:`)) {
    const [, encodedSalt, encodedIv, encodedCiphertext] = value.split(':');
    const salt = decodeWordArray(encodedSalt);
    const iv = decodeWordArray(encodedIv);
    const ciphertext = decodeWordArray(encodedCiphertext);
    const key = deriveKey(secret, salt);
    const decrypted = CryptoJS.AES.decrypt({ ciphertext }, key, { iv });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  return '';
}

function deriveKey(secret: string, salt: any): any {
  return CryptoJS.PBKDF2(secret, salt, {
    keySize: KEY_SIZE_WORDS,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
}

function encodeWordArray(value: any): string {
  return CryptoJS.enc.Base64.stringify(value);
}

function decodeWordArray(value: string): any {
  return CryptoJS.enc.Base64.parse(value);
}
