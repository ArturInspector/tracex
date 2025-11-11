/**
 * Client-side расшифровка traces
 * Использует Web Crypto API для расшифровки данных
 */

export interface EncryptedTrace {
  traceId: string;
  facilitatorId?: string;
  encryptedData: string; // Base64
  aesKeyEncrypted: string; // Base64
  iv: string; // Base64
  timestamp: number;
}

export interface Trace {
  traceId: string;
  spans: Array<{
    name: string;
    startTime: number;
    endTime: number;
    duration: number;
    status: 'success' | 'error';
    error?: {
      message: string;
      code?: string;
      stack?: string;
    };
    attributes?: Record<string, unknown>;
  }>;
  metadata: Record<string, unknown>;
}

export class DecryptionService {
  /**
   * Расшифровка trace используя приватный ключ
   */
  async decryptTrace(encryptedTrace: EncryptedTrace, privateKeyPem: string): Promise<Trace> {
    try {
      // Импортируем приватный ключ
      const privateKey = await this.importPrivateKey(privateKeyPem);

      // Расшифровываем AES ключ RSA
      const encryptedAesKeyBuffer = this.base64ToArrayBuffer(encryptedTrace.aesKeyEncrypted);
      const aesKeyBuffer = await crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        privateKey,
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
      console.error('[DecryptionService] Failed to decrypt trace', {
        traceId: encryptedTrace.traceId,
        error,
      });
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Импорт RSA приватного ключа из PEM (Web Crypto API)
   */
  private async importPrivateKey(pem: string): Promise<CryptoKey> {
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

  private base64ToUint8Array(base64: string): Uint8Array {
    const buffer = this.base64ToArrayBuffer(base64);
    return new Uint8Array(buffer);
  }
}
