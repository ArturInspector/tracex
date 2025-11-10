/**
 * Key Manager - Генерация и управление RSA ключами
 * Автоматически генерирует ключи при первом использовании
 * Сохраняет ключи локально (файл или env переменные)
 */

// Динамические импорты для Node.js окружения
let fs: typeof import('fs') | null = null;
let promisify: typeof import('util').promisify | null = null;

function getNodeModules() {
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      promisify = require('util').promisify;
      return { fs, promisify };
    } catch {
      return null;
    }
  }
  return null;
}

export interface KeyPair {
  publicKey: string; // PEM формат
  privateKey: string; // PEM формат
}

export interface KeyManagerConfig {
  keysPath?: string; // путь к файлу для сохранения ключей
  keySize?: number; // размер RSA ключа (по умолчанию 2048)
}

export class KeyManager {
  private keys: KeyPair | null = null;
  private readonly config: Required<KeyManagerConfig>;
  private readonly isNode: boolean;

  constructor(config: KeyManagerConfig = {}) {
    this.config = {
      keysPath: config.keysPath || '.tracex-keys.json',
      keySize: config.keySize || 2048,
    };
    this.isNode = typeof process !== 'undefined' && process.versions?.node !== undefined;
  }

  /**
   * Генерация RSA ключей
   */
  async generateKeys(): Promise<KeyPair> {
    if (this.isNode) {
      return this.generateKeysNode();
    } else {
      return this.generateKeysWeb();
    }
  }

  /**
   * Генерация ключей в Node.js окружении
   */
  private async generateKeysNode(): Promise<KeyPair> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto');
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: this.config.keySize,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      const keyPair: KeyPair = {
        publicKey,
        privateKey,
      };

      // Сохраняем ключи локально
      await this.saveKeys(keyPair);

      this.keys = keyPair;
      return keyPair;
    } catch (error) {
      throw new Error(`Failed to generate RSA keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Генерация ключей в браузерном окружении (Web Crypto API)
   */
  private async generateKeysWeb(): Promise<KeyPair> {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: this.config.keySize,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Экспортируем ключи в PEM формат
      const publicKeyPem = await this.exportKeyToPem(keyPair.publicKey, 'public');
      const privateKeyPem = await this.exportKeyToPem(keyPair.privateKey, 'private');

      const keyPairResult: KeyPair = {
        publicKey: publicKeyPem,
        privateKey: privateKeyPem,
      };

      // В браузере сохраняем в localStorage
      if (typeof window !== 'undefined' && typeof (window as any).localStorage !== 'undefined') {
        (window as any).localStorage.setItem('tracex_keys', JSON.stringify(keyPairResult));
      }

      this.keys = keyPairResult;
      return keyPairResult;
    } catch (error) {
      throw new Error(`Failed to generate RSA keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async exportKeyToPem(key: any, type: 'public' | 'private'): Promise<string> {
    const format = type === 'public' ? 'spki' : 'pkcs8';
    const exported = await crypto.subtle.exportKey(format, key);
    const exportedAsBuffer = Buffer.from(exported);
    const base64 = exportedAsBuffer.toString('base64');
    const pemHeader = type === 'public' ? '-----BEGIN PUBLIC KEY-----' : '-----BEGIN PRIVATE KEY-----';
    const pemFooter = type === 'public' ? '-----END PUBLIC KEY-----' : '-----END PRIVATE KEY-----';
    
    const pem = `${pemHeader}\n${base64.match(/.{1,64}/g)?.join('\n') || base64}\n${pemFooter}`;
    return pem;
  }

  async getOrGenerateKeys(): Promise<KeyPair> {
    if (this.keys) {
      return this.keys;
    }

    // Пытаемся загрузить из файла/env
    const loaded = await this.loadKeys();
    if (loaded) {
      this.keys = loaded;
      return loaded;
    }

    // Генерируем новые
    return this.generateKeys();
  }

  /**
   * Получить публичный ключ
   */
  async getPublicKey(): Promise<string> {
    const keys = await this.getOrGenerateKeys();
    return keys.publicKey;
  }

  /**
   * Получить приватный ключ
   */
  async getPrivateKey(): Promise<string> {
    const keys = await this.getOrGenerateKeys();
    return keys.privateKey;
  }

  /**
   * Сохранение ключей в файл
   */
  private async saveKeys(keyPair: KeyPair): Promise<void> {
    if (!this.isNode) {
      return; // В браузере используем localStorage
    }

    const nodeModules = getNodeModules();
    if (!nodeModules || !nodeModules.fs || !nodeModules.promisify) {
      return;
    }

    try {
      const writeFile = nodeModules.promisify(nodeModules.fs.writeFile);
      const keysData = JSON.stringify(keyPair, null, 2);
      await writeFile(this.config.keysPath, keysData, { mode: 0o600 }); // Только для владельца
    } catch (error) {
      // Игнорируем ошибки сохранения (может не быть прав на запись)
      console.warn('[KeyManager] Failed to save keys to file:', error);
    }
  }

  /**
   * Загрузка ключей из файла/env
   */
  private async loadKeys(): Promise<KeyPair | null> {
    // Проверяем env переменные сначала
    if (this.isNode && process.env.TRACEX_PUBLIC_KEY && process.env.TRACEX_PRIVATE_KEY) {
      return {
        publicKey: process.env.TRACEX_PUBLIC_KEY,
        privateKey: process.env.TRACEX_PRIVATE_KEY,
      };
    }

    // Проверяем localStorage в браузере
    if (typeof window !== 'undefined' && typeof (window as any).localStorage !== 'undefined') {
      const stored = (window as any).localStorage.getItem('tracex_keys');
      if (stored) {
        try {
          return JSON.parse(stored) as KeyPair;
        } catch {
          // Игнорируем ошибки парсинга
        }
      }
    }

    // Пытаемся загрузить из файла (Node.js)
    if (this.isNode) {
      const nodeModules = getNodeModules();
      if (nodeModules && nodeModules.fs && nodeModules.promisify) {
        try {
          const readFile = nodeModules.promisify(nodeModules.fs.readFile);
          const keysData = await readFile(this.config.keysPath, 'utf8');
          const keyPair = JSON.parse(keysData) as KeyPair;
          
          // Валидация формата
          if (keyPair.publicKey && keyPair.privateKey) {
            return keyPair;
          }
        } catch {
          // Файл не существует или ошибка чтения - это нормально
        }
      }
    }

    return null;
  }

  /**
   * Установить ключи вручную (для тестирования или импорта)
   */
  setKeys(keyPair: KeyPair): void {
    this.keys = keyPair;
  }

  /**
   * Очистить ключи из памяти
   */
  clearKeys(): void {
    this.keys = null;
  }
}

