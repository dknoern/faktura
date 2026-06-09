import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  tag: string;
  last4: string;
}

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY is not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }

  const decoded = Buffer.from(raw, "base64");
  if (decoded.length !== KEY_LENGTH) {
    throw new Error(
      `CREDENTIALS_ENCRYPTION_KEY must base64-decode to exactly ${KEY_LENGTH} bytes (got ${decoded.length}).`
    );
  }

  cachedKey = decoded;
  return cachedKey;
}

export function encryptSecret(plaintext: string): EncryptedSecret {
  if (!plaintext) throw new Error("Cannot encrypt empty secret");

  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    last4: plaintext.slice(-4),
  };
}

export function decryptSecret(input: {
  ciphertext: string;
  iv: string;
  tag: string;
}): string {
  const key = getKey();
  const iv = Buffer.from(input.iv, "base64");
  const tag = Buffer.from(input.tag, "base64");
  const ciphertext = Buffer.from(input.ciphertext, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

export function __resetKeyCacheForTests() {
  cachedKey = null;
}
