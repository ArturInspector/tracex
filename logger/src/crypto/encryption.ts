/**
 * Encryption Service - Гибридное шифрование AES-256-GCM + RSA
 * Генерирует случайный AES ключ для каждого trace
 * Шифрует AES ключ RSA публичным ключом
 */

import type { Trace } from '../types.js';

export interface EncryptedTrace {
  traceId: string;
  facilitatorId?: string;
  encryptedData: string; // Base64 зашифрованные данные (AES-256-GCM)
  aesKeyEncrypted: string; // Base64 зашифрованный AES ключ (RSA)
  iv: string; // Base64 initialization vector для AES-GCM
  timestamp: number;
}

export class EncryptionService {
  /**
   * Шифрование trace с использованием гибридного шифрования
   * @param trace - Trace для шифрования
   * @param publicKey - RSA публичный ключ в PEM формате
   * @param facilitatorId - Опциональный идентификатор facilitator'а
   */
  async encryptTrace(trace: Trace, publicKey: string, facilitatorId?: string): Promise<EncryptedTrace> {
    const isNode = typeof process !== 'undefined' && process.versions?.node !== undefined;

    if (isNode) {
      return this.encryptTraceNode(trace, publicKey, facilitatorId);
    } else {
      return this.encryptTraceWeb(trace, publicKey, facilitatorId);
    }
  }

  /**
   * Шифрование в Node.js окружении
   */
  private async encryptTraceNode(
    trace: Trace,
    publicKey: string,
    facilitatorId?: string
  ): Promise<EncryptedTrace> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto');

      // Сериализуем trace в JSON
      const traceJson = JSON.stringify(trace);
      const traceBuffer = Buffer.from(traceJson, 'utf8');

      // Генерируем случайный AES ключ (256-bit) и IV
      const aesKey = crypto.randomBytes(32); // 256 bits
      const iv = crypto.randomBytes(12); // 96 bits для GCM

      // Шифруем данные AES-256-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
      const encrypted = Buffer.concat([cipher.update(traceBuffer, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Объединяем encrypted data + auth tag
      const encryptedWithTag = Buffer.concat([encrypted, authTag]);

      // Шифруем AES ключ RSA публичным ключом
      const encryptedAesKey = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        aesKey
      );

      return {
        traceId: trace.traceId,
        facilitatorId,
        encryptedData: encryptedWithTag.toString('base64'),
        aesKeyEncrypted: encryptedAesKey.toString('base64'),
        iv: iv.toString('base64'),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Шифрование в браузерном окружении (Web Crypto API)
   */
  private async encryptTraceWeb(
    trace: Trace,
    publicKey: string,
    facilitatorId?: string
  ): Promise<EncryptedTrace> {
    try {
      // Сериализуем trace в JSON
      const traceJson = JSON.stringify(trace);
      const traceBuffer = new TextEncoder().encode(traceJson);

      // Генерируем случайный AES ключ
      const aesKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt']
      );

      // Генерируем IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Шифруем данные AES-256-GCM
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128, // 128-bit auth tag
        },
        aesKey,
        traceBuffer
      );

      // Экспортируем AES ключ для шифрования RSA
      const exportedAesKey = await crypto.subtle.exportKey('raw', aesKey);

      // Импортируем RSA публичный ключ
      const publicKeyCrypto = await this.importPublicKey(publicKey);

      // Шифруем AES ключ RSA
      const encryptedAesKey = await crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKeyCrypto,
        exportedAesKey
      );

      return {
        traceId: trace.traceId,
        facilitatorId,
        encryptedData: this.arrayBufferToBase64(encrypted),
        aesKeyEncrypted: this.arrayBufferToBase64(encryptedAesKey),
        iv: this.arrayBufferToBase64(iv.buffer),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Расшифровка trace
   * @param encryptedTrace - Зашифрованный trace
   * @param privateKey - RSA приватный ключ в PEM формате
   */
  async decryptTrace(encryptedTrace: EncryptedTrace, privateKey: string): Promise<Trace> {
    const isNode = typeof process !== 'undefined' && process.versions?.node !== undefined;

    if (isNode) {
      return this.decryptTraceNode(encryptedTrace, privateKey);
    } else {
      return this.decryptTraceWeb(encryptedTrace, privateKey);
    }
  }

  /**
   * Расшифровка в Node.js окружении
   */
  private async decryptTraceNode(encryptedTrace: EncryptedTrace, privateKey: string): Promise<Trace> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto');

      // Расшифровываем AES ключ RSA приватным ключом
      const aesKeyBuffer = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(encryptedTrace.aesKeyEncrypted, 'base64')
      );

      // Декодируем IV
      const iv = Buffer.from(encryptedTrace.iv, 'base64');

      // Декодируем зашифрованные данные
      const encryptedBuffer = Buffer.from(encryptedTrace.encryptedData, 'base64');

      // Разделяем encrypted data и auth tag (последние 16 байт)
      const authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
      const encrypted = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);

      // Расшифровываем данные AES-256-GCM
      const decipher = crypto.createDecipheriv('aes-256-gcm', aesKeyBuffer, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      // Парсим JSON
      const traceJson = decrypted.toString('utf8');
      return JSON.parse(traceJson) as Trace;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Расшифровка в браузерном окружении (Web Crypto API)
   */
  private async decryptTraceWeb(encryptedTrace: EncryptedTrace, privateKey: string): Promise<Trace> {
    try {
      // Импортируем RSA приватный ключ
      const privateKeyCrypto = await this.importPrivateKey(privateKey);

      // Расшифровываем AES ключ RSA
      const encryptedAesKeyBuffer = this.base64ToArrayBuffer(encryptedTrace.aesKeyEncrypted);
      const aesKeyBuffer = await crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        privateKeyCrypto,
        encryptedAesKeyBuffer
      );

      // Импортируем AES ключ
      const aesKey = await crypto.subtle.importKey(
        'raw',
        aesKeyBuffer,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['decrypt']
      );

      // Декодируем IV
      const iv = this.base64ToArrayBuffer(encryptedTrace.iv);

      // Декодируем зашифрованные данные
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedTrace.encryptedData);

      // Расшифровываем данные AES-256-GCM
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128,
        },
        aesKey,
        encryptedBuffer
      );

      // Парсим JSON
      const traceJson = new TextDecoder().decode(decrypted);
      return JSON.parse(traceJson) as Trace;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Импорт RSA публичного ключа из PEM (Web Crypto API)
   */
  private async importPublicKey(pem: string): Promise<any> {
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = pem
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    const binaryDer = this.base64ToArrayBuffer(pemContents);

    return crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );
  }

  /**
   * Импорт RSA приватного ключа из PEM (Web Crypto API)
   */
  private async importPrivateKey(pem: string): Promise<any> {
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = pem
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    const binaryDer = this.base64ToArrayBuffer(pemContents);

    return crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['decrypt']
    );
  }

  /**
   * Конвертация ArrayBuffer в Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Конвертация Base64 в ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

