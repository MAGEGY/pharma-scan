import { loggingService } from './loggingService';
import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';
import { users, userSessions, auditLogs } from '../shared/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isPremium: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

export interface SecurityContext {
  user: AuthUser;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  platform?: string;
}

export class SecurityService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  private loginAttempts: Map<string, { count: number; lastAttempt: number; lockedUntil?: number }> = new Map();

  constructor() {
    this.startSecurityMonitoring();
  }

  // PASSWORD SECURITY
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // JWT TOKEN MANAGEMENT
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): string {
    return jwt.sign(
      {
        ...payload,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.ACCESS_TOKEN_EXPIRY,
      },
      this.JWT_SECRET,
      { algorithm: 'HS256' }
    );
  }

  generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>): string {
    return jwt.sign(
      {
        ...payload,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.REFRESH_TOKEN_EXPIRY,
      },
      this.JWT_REFRESH_SECRET,
      { algorithm: 'HS256' }
    );
  }

  verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      return decoded.type === 'access' ? decoded : null;
    } catch (error) {
      loggingService.warn('Invalid access token', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  verifyRefreshToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET) as JWTPayload;
      return decoded.type === 'refresh' ? decoded : null;
    } catch (error) {
      loggingService.warn('Invalid refresh token', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  // LOGIN SECURITY
  async checkLoginAttempts(email: string): Promise<{ allowed: boolean; remainingAttempts: number; lockedUntil?: number }> {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    
    // Check if account is locked
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: attempts.lockedUntil,
      };
    }

    // Reset lockout if period has passed
    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      this.loginAttempts.set(email, { count: 0, lastAttempt: 0 });
      return { allowed: true, remainingAttempts: this.MAX_LOGIN_ATTEMPTS };
    }

    const remainingAttempts = Math.max(0, this.MAX_LOGIN_ATTEMPTS - attempts.count);
    
    return {
      allowed: remainingAttempts > 0,
      remainingAttempts,
    };
  }

  async recordLoginAttempt(email: string, success: boolean): Promise<void> {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    
    if (success) {
      // Reset on successful login
      this.loginAttempts.delete(email);
      loggingService.info('Login successful - attempts reset', { email });
    } else {
      // Increment failed attempts
      const newCount = attempts.count + 1;
      const lockedUntil = newCount >= this.MAX_LOGIN_ATTEMPTS ? Date.now() + this.LOCKOUT_DURATION : undefined;
      
      this.loginAttempts.set(email, {
        count: newCount,
        lastAttempt: Date.now(),
        lockedUntil,
      });

      loggingService.warn('Login failed - attempt recorded', {
        email,
        attemptCount: newCount,
        lockedUntil: lockedUntil ? new Date(lockedUntil).toISOString() : undefined,
      });
    }
  }

  // SESSION MANAGEMENT
  async createSession(user: AuthUser, deviceInfo: any, ipAddress: string, userAgent: string): Promise<{
    sessionId: string;
    accessToken: string;
    refreshToken: string;
  }> {
    const sessionId = crypto.randomUUID();
    
    // Store session in database
    await db.insert(userSessions).values({
      id: sessionId,
      userId: user.id,
      sessionToken: crypto.randomBytes(32).toString('hex'),
      refreshToken: crypto.randomBytes(32).toString('hex'),
      deviceInfo,
      ipAddress,
      userAgent,
      isActive: true,
      expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY * 1000),
    });

    // Generate JWT tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      sessionId,
    });

    const refreshToken = this.generateRefreshToken({
      userId: user.id,
      email: user.email,
      sessionId,
    });

    // Update user's last login
    await db.update(users)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(users.id, user.id));

    loggingService.info('Session created', {
      userId: user.id,
      sessionId,
      ipAddress,
      userAgent: userAgent.substring(0, 100),
    }, {
      business: {
        action: 'session_created',
        result: 'success',
      },
    });

    return {
      sessionId,
      accessToken,
      refreshToken,
    };
  }

  async validateSession(sessionId: string): Promise<AuthUser | null> {
    try {
      const session = await db.select()
        .from(userSessions)
        .where(and(
          eq(userSessions.id, sessionId),
          eq(userSessions.isActive, true)
        ))
        .limit(1);

      if (!session.length) {
        return null;
      }

      const sessionData = session[0];
      
      // Check if session has expired
      if (new Date() > sessionData.expiresAt) {
        await this.invalidateSession(sessionId);
        return null;
      }

      // Get user data
      const userData = await db.select()
        .from(users)
        .where(eq(users.id, sessionData.userId))
        .limit(1);

      if (!userData.length || !userData[0].isActive) {
        return null;
      }

      const user = userData[0];

      // Update last accessed time
      await db.update(userSessions)
        .set({ lastAccessedAt: new Date() })
        .where(eq(userSessions.id, sessionId));

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || undefined,
        dateOfBirth: user.dateOfBirth?.toISOString(),
        gender: user.gender || undefined,
        profilePicture: user.profilePicture || undefined,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isPremium: user.isPremium,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    } catch (error) {
      loggingService.error('Session validation failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      await db.update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.id, sessionId));

      loggingService.info('Session invalidated', { sessionId });

      return true;
    } catch (error) {
      loggingService.error('Session invalidation failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async invalidateAllUserSessions(userId: string): Promise<boolean> {
    try {
      await db.update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.userId, userId));

      loggingService.info('All user sessions invalidated', { userId });

      return true;
    } catch (error) {
      loggingService.error('User sessions invalidation failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // AUDIT LOGGING
  async logSecurityEvent(
    userId: string | null,
    action: string,
    resource: string,
    resourceId: string | null,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    oldValues?: any,
    newValues?: any,
    errorMessage?: string
  ): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId,
        action,
        resource,
        resourceId,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
        success,
        errorMessage,
      });
    } catch (error) {
      // Don't throw errors for audit logging to avoid breaking main flow
      loggingService.error('Audit logging failed', {
        userId,
        action,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // SECURITY MONITORING
  private startSecurityMonitoring(): void {
    // Monitor for suspicious activities
    setInterval(async () => {
      try {
        await this.checkForSuspiciousActivity();
        await this.cleanupExpiredSessions();
        await this.cleanupOldLoginAttempts();
      } catch (error) {
        loggingService.error('Security monitoring error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async checkForSuspiciousActivity(): Promise<void> {
    // Check for multiple failed logins from same IP
    const recentFailedLogins = await db.select()
      .from(auditLogs)
      .where(and(
        eq(auditLogs.action, 'login_attempt'),
        eq(auditLogs.success, false)
      ))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);

    const ipCounts = new Map<string, number>();
    
    for (const login of recentFailedLogins) {
      const count = ipCounts.get(login.ipAddress || '') || 0;
      ipCounts.set(login.ipAddress || '', count + 1);
      
      if (count >= 10) {
        loggingService.warn('Suspicious activity detected - multiple failed logins', {
          ipAddress: login.ipAddress,
          count: count + 1,
        });
      }
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    try {
      await db.update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.expiresAt, new Date()));

      loggingService.debug('Expired sessions cleaned up');
    } catch (error) {
      loggingService.error('Session cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private cleanupOldLoginAttempts(): Promise<void> {
    const now = Date.now();
    const cutoffTime = now - (24 * 60 * 60 * 1000); // 24 hours ago

    for (const [email, attempts] of this.loginAttempts.entries()) {
      if (attempts.lastAttempt < cutoffTime) {
        this.loginAttempts.delete(email);
      }
    }

    return Promise.resolve();
  }

  // RATE LIMITING
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  checkRateLimit(identifier: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    const existing = this.rateLimitMap.get(key);

    if (!existing || now > existing.resetTime) {
      // New window or expired window
      const resetTime = now + windowMs;
      this.rateLimitMap.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    if (existing.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: existing.resetTime };
    }

    existing.count++;
    return { allowed: true, remaining: maxRequests - existing.count, resetTime: existing.resetTime };
  }

  // DATA ENCRYPTION
  encryptSensitiveData(data: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('pharma-scan', 'utf8'));

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decryptSensitiveData(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('pharma-scan', 'utf8'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // SECURITY VALIDATION
  validatePasswordStrength(password: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      issues.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push('Password must contain at least one special character');
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      issues.push('Password cannot contain three or more repeated characters');
    }

    if (password.toLowerCase().includes('password') || 
        password.toLowerCase().includes('123456') ||
        password.toLowerCase().includes('qwerty')) {
      issues.push('Password cannot contain common patterns');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    // Egyptian phone number validation
    const phoneRegex = /^(\+20)?(01[0-2,5]{1}\d{8})$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  // SECURITY HEADERS
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }

  // SECURITY ANALYTICS
  async getSecurityMetrics(): Promise<{
    totalUsers: number;
    activeSessions: number;
    recentLogins: number;
    failedLogins: number;
    suspiciousIPs: string[];
    lockedAccounts: number;
  }> {
    try {
      const totalUsers = await db.select().from(users).then(res => res.length);
      const activeSessions = await db.select().from(userSessions).where(eq(userSessions.isActive, true)).then(res => res.length);
      
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const recentLogins = await db.select()
        .from(auditLogs)
        .where(and(
          eq(auditLogs.action, 'login_success'),
          // @ts-ignore
          auditLogs.createdAt > oneHourAgo
        ))
        .then(res => res.length);

      const failedLogins = await db.select()
        .from(auditLogs)
        .where(and(
          eq(auditLogs.action, 'login_attempt'),
          eq(auditLogs.success, false),
          // @ts-ignore
          auditLogs.createdAt > oneHourAgo
        ))
        .then(res => res.length);

      const suspiciousIPs = Array.from(this.rateLimitMap.entries())
        .filter(([_, data]) => data.count > 10)
        .map(([ip]) => ip);

      const lockedAccounts = Array.from(this.loginAttempts.entries())
        .filter(([_, attempts]) => attempts.lockedUntil && attempts.lockedUntil > Date.now())
        .length;

      return {
        totalUsers,
        activeSessions,
        recentLogins,
        failedLogins,
        suspiciousIPs,
        lockedAccounts,
      };
    } catch (error) {
      loggingService.error('Failed to get security metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        totalUsers: 0,
        activeSessions: 0,
        recentLogins: 0,
        failedLogins: 0,
        suspiciousIPs: [],
        lockedAccounts: 0,
      };
    }
  }
}

export const securityService = new SecurityService();
