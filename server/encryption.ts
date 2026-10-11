import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 32; // 256 bits

  // Generate encryption key from password
  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256');
  }

  // Generate random salt
  private generateSalt(): Buffer {
    return crypto.randomBytes(this.saltLength);
  }

  // Generate random IV
  private generateIV(): Buffer {
    return crypto.randomBytes(this.ivLength);
  }

  // Encrypt sensitive data
  encrypt(plaintext: string, password?: string): {
    encrypted: string;
    salt: string;
    iv: string;
    tag: string;
  } {
    try {
      // Use environment key if no password provided
      const encryptionKey = password || process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
      
      const salt = this.generateSalt();
      const iv = this.generateIV();
      const key = this.deriveKey(encryptionKey, salt);

      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      cipher.setAAD(Buffer.from('medscan-egypt')); // Additional authenticated data

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData: {
    encrypted: string;
    salt: string;
    iv: string;
    tag: string;
  }, password?: string): string {
    try {
      // Use environment key if no password provided
      const encryptionKey = password || process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
      
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      const key = this.deriveKey(encryptionKey, salt);

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAAD(Buffer.from('medscan-egypt')); // Additional authenticated data
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash sensitive data (one-way)
  hash(data: string, salt?: string): string {
    const hashSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, hashSalt, 100000, 64, 'sha512').toString('hex');
    return `${hashSalt}:${hash}`;
  }

  // Verify hash
  verifyHash(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':');
    const computedHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512').toString('hex');
    return hash === computedHash;
  }

  // Generate secure random token
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate UUID
  generateUUID(): string {
    return crypto.randomUUID();
  }

  // Mask sensitive data for logging
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }
    
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(data.length - (visibleChars * 2));
    
    return start + middle + end;
  }

  // Encrypt prescription data
  encryptPrescription(prescriptionData: any): {
    encryptedData: string;
    metadata: {
      encrypted: string;
      salt: string;
      iv: string;
      tag: string;
    };
  } {
    const jsonString = JSON.stringify(prescriptionData);
    const encryptionResult = this.encrypt(jsonString);

    return {
      encryptedData: encryptionResult.encrypted,
      metadata: {
        encrypted: encryptionResult.encrypted,
        salt: encryptionResult.salt,
        iv: encryptionResult.iv,
        tag: encryptionResult.tag,
      },
    };
  }

  // Decrypt prescription data
  decryptPrescription(metadata: {
    encrypted: string;
    salt: string;
    iv: string;
    tag: string;
  }): any {
    const decryptedString = this.decrypt(metadata);
    return JSON.parse(decryptedString);
  }

  // Encrypt PHI (Protected Health Information)
  encryptPHI(phiData: any): {
    encrypted: string;
    salt: string;
    iv: string;
    tag: string;
  } {
    return this.encrypt(JSON.stringify(phiData));
  }

  // Decrypt PHI
  decryptPHI(encryptedData: {
    encrypted: string;
    salt: string;
    iv: string;
    tag: string;
  }): any {
    const decryptedString = this.decrypt(encryptedData);
    return JSON.parse(decryptedString);
  }

  // Generate HMAC for data integrity
  generateHMAC(data: string, secret?: string): string {
    const hmacSecret = secret || process.env.HMAC_SECRET || 'default-hmac-secret-change-in-production';
    return crypto.createHmac('sha256', hmacSecret).update(data).digest('hex');
  }

  // Verify HMAC
  verifyHMAC(data: string, hmac: string, secret?: string): boolean {
    const expectedHMAC = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHMAC, 'hex'));
  }
}

export const encryptionService = new EncryptionService();

// Utility functions for common encryption tasks
export const encryptField = (value: string): string => {
  const encrypted = encryptionService.encrypt(value);
  return JSON.stringify(encrypted);
};

export const decryptField = (encryptedValue: string): string => {
  try {
    const encrypted = JSON.parse(encryptedValue);
    return encryptionService.decrypt(encrypted);
  } catch (error) {
    console.error('Failed to decrypt field:', error);
    return '';
  }
};

export const hashField = (value: string): string => {
  return encryptionService.hash(value);
};

export const verifyFieldHash = (value: string, hash: string): boolean => {
  return encryptionService.verifyHash(value, hash);
};

export const generateChecksum = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};
