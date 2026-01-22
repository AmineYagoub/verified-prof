import * as crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const keyLength = 32;
const ivLength = 16;

const getEnvSafely = (envKey: string) => {
  const envVal = process.env[envKey];
  if (!envVal && process.env['NODE_ENV'] === 'production') {
    throw new Error(`Missing env variable ${envKey}!`);
  }
  return envVal ?? '';
};

const deriveKey = (userId: string): Buffer => {
  const masterKey = getEnvSafely('BETTER_AUTH_SECRET');
  return crypto.pbkdf2Sync(masterKey, userId, 100000, keyLength, 'sha256');
};

export const encrypt = (plaintext: string, userId: string): string => {
  try {
    const key = deriveKey(userId);
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    cipher.setAAD(Buffer.from(`verified-prof-${userId}`, 'utf8'));
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    const result = {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted: encrypted,
    };
    return Buffer.from(JSON.stringify(result)).toString('base64');
  } catch {
    throw new Error('Failed to encrypt data');
  }
};

export const decrypt = (encryptedData: string, userId: string): string => {
  try {
    const key = deriveKey(userId);
    const data = JSON.parse(
      Buffer.from(encryptedData, 'base64').toString('utf8'),
    ) as {
      iv: string;
      authTag: string;
      encrypted: string;
    };
    const iv = Buffer.from(data.iv, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAAD(Buffer.from(`verified-prof-${userId}`, 'utf8'));
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    throw new Error('Failed to decrypt data');
  }
};
