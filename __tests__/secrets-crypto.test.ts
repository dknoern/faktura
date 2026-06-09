import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { randomBytes } from 'crypto';
import { encryptSecret, decryptSecret, __resetKeyCacheForTests } from '@/lib/crypto/secrets';

const ORIGINAL = process.env.CREDENTIALS_ENCRYPTION_KEY;

beforeEach(() => {
    process.env.CREDENTIALS_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    __resetKeyCacheForTests();
});

afterEach(() => {
    process.env.CREDENTIALS_ENCRYPTION_KEY = ORIGINAL;
    __resetKeyCacheForTests();
});

describe('credentials crypto', () => {
    it('round-trips a fake key', () => {
        const fake = 'sk_test_1234567890abcdefghij';
        const encrypted = encryptSecret(fake);

        expect(encrypted.ciphertext).toBeTruthy();
        expect(encrypted.iv).toBeTruthy();
        expect(encrypted.tag).toBeTruthy();
        expect(encrypted.last4).toBe('ghij');

        const decrypted = decryptSecret(encrypted);
        expect(decrypted).toBe(fake);
    });

    it('produces different ciphertext for the same plaintext (random IV)', () => {
        const fake = 'sk_test_same_input';
        const a = encryptSecret(fake);
        const b = encryptSecret(fake);
        expect(a.ciphertext).not.toBe(b.ciphertext);
        expect(a.iv).not.toBe(b.iv);
    });

    it('throws on a tampered tag', () => {
        const fake = 'sk_test_to_tamper';
        const encrypted = encryptSecret(fake);
        const tamperedTag = Buffer.from(encrypted.tag, 'base64');
        tamperedTag[0] = tamperedTag[0] ^ 0xff;
        expect(() => decryptSecret({ ...encrypted, tag: tamperedTag.toString('base64') })).toThrow();
    });

    it('throws when the env var is missing', () => {
        delete process.env.CREDENTIALS_ENCRYPTION_KEY;
        __resetKeyCacheForTests();
        expect(() => encryptSecret('anything')).toThrow(/CREDENTIALS_ENCRYPTION_KEY/);
    });

    it('throws when the env var decodes to the wrong length', () => {
        process.env.CREDENTIALS_ENCRYPTION_KEY = Buffer.from('short').toString('base64');
        __resetKeyCacheForTests();
        expect(() => encryptSecret('anything')).toThrow(/32 bytes/);
    });
});
