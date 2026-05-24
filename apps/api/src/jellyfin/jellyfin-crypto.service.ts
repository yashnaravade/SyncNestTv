import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const IV_LENGTH = 12;
const ALGORITHM = 'aes-256-gcm';

@Injectable()
export class JellyfinCryptoService {
  private key: Buffer;

  constructor() {
    const rawSecret = process.env.JELLYFIN_ENCRYPT_KEY;
    if (!rawSecret) {
      throw new InternalServerErrorException(
        'JELLYFIN_ENCRYPT_KEY is required for Jellyfin API key encryption'
      );
    }

    this.key = createHash('sha256').update(rawSecret, 'utf8').digest();
  }

  encrypt(value: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, { authTagLength: 16 });
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  }

  decrypt(value: string): string {
    try {
      const data = Buffer.from(value, 'base64');
      const iv = data.slice(0, IV_LENGTH);
      const authTag = data.slice(IV_LENGTH, IV_LENGTH + 16);
      const ciphertext = data.slice(IV_LENGTH + 16);
      const decipher = createDecipheriv(ALGORITHM, this.key, iv, { authTagLength: 16 });
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return plaintext.toString('utf8');
    } catch (error) {
      throw new InternalServerErrorException('Failed to decrypt Jellyfin API key');
    }
  }
}
