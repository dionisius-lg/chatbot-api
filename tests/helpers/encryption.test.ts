jest.mock('../../src/config', () => ({
  __esModule: true,
  default: {
    secret: '12345678901234567890123456789012' // Exactly 32 characters for AES-256
  }
}));

import { encrypt, decrypt } from '../../src/helpers/encryption';

describe('Encryption Helper Tests', () => {
  test('should encrypt and decrypt a string successfully', () => {
    const rawText = 'Hello World Secret';
    const encryptedText = encrypt(rawText);
    
    expect(encryptedText).not.toBeNull();
    expect(encryptedText).not.toBe(rawText);
    
    const decryptedText = decrypt(encryptedText!);
    expect(decryptedText).toBe(rawText);
  });

  test('should return null when decrypting invalid hex string', () => {
    const decrypted = decrypt('invalid-hex-string');
    expect(decrypted).toBeNull();
  });
});
