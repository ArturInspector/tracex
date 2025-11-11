#!/usr/bin/env node
/**
 * Быстрый тест шифрования - проверяем что SDK encryption работает
 */

import { generateKeyPair } from 'crypto';
import { promisify } from 'util';
import { EncryptionService } from '../logger/dist/crypto/encryption.js';

const generateKeyPairAsync = promisify(generateKeyPair);

async function test() {
  console.log('🧪 Testing SDK encryption...\n');

  // 1. Генерируем ключи
  const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  console.log('✅ Generated RSA keypair');
  console.log('Public key:', publicKey.substring(0, 50) + '...');
  console.log('Private key:', privateKey.substring(0, 50) + '...\n');

  // 2. Создаём тестовый trace
  const testTrace = {
    traceId: 'test-trace-123',
    spans: [
      {
        name: 'test_operation',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100_000_000,
        status: 'success',
        attributes: {
          'test': 'value',
        },
      },
    ],
    metadata: {
      facilitator: 'test-facilitator',
    },
  };

  console.log('📦 Test trace:', JSON.stringify(testTrace, null, 2), '\n');

  // 3. Шифруем через SDK
  const encryptionService = new EncryptionService();
  const encrypted = await encryptionService.encryptTrace(testTrace, publicKey, 'test-facilitator');

  console.log('🔐 Encrypted trace:');
  console.log('- traceId:', encrypted.traceId);
  console.log('- encryptedData length:', encrypted.encryptedData.length);
  console.log('- aesKeyEncrypted length:', encrypted.aesKeyEncrypted.length);
  console.log('- iv length:', encrypted.iv.length);
  console.log();

  // 4. Расшифровываем через SDK
  const decrypted = await encryptionService.decryptTrace(encrypted, privateKey);

  console.log('🔓 Decrypted trace:', JSON.stringify(decrypted, null, 2), '\n');

  // 5. Проверяем что данные совпадают
  if (JSON.stringify(testTrace) === JSON.stringify(decrypted)) {
    console.log('✅ SUCCESS! Encryption/Decryption works perfectly!');
    console.log('\n📋 Use these in demo endpoint:');
    console.log('- IV size: 12 bytes (96 bits)');
    console.log('- RSA-OAEP hash: SHA-256');
    console.log('- AES-256-GCM with auth tag at the end');
    console.log('- Data structure: full Trace object with spans array');
  } else {
    console.log('❌ FAILED! Data mismatch after decryption');
  }
}

test().catch(console.error);

