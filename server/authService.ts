import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, schema } from './db';
import { eq, and, desc, lt } from 'drizzle-orm';
import { 
  User, 
  UserSession, 
  PasswordResetToken, 
  EmailVerificationToken,
  AuthResponse,
  JwtPayload,
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest
} from '../shared/schema';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
  private readonly JWT_EXPIRES_IN = '15m'; // 15 minutes for access token
  private readonly JWT_REFRESH_EXPIRES_IN = '7d'; // 7 days for refresh token
  private readonly BCRYPT_ROUNDS = 12;
  private readonly MAX_SESSIONS_PER_USER = 5;

  // Generate secure random tokens
  private generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash password with salt
  private async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = await bcrypt.genSalt(this.BCRYPT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return { hash, salt };
  }

  // Verify password against hash
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Generate JWT tokens
  private generateTokens(userId: string, email: string, sessionId: string): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 15 * 60; // 15 minutes in seconds

    const accessToken = jwt.sign(
      {
        userId,
        email,
        sessionId,
        iat: now,
        exp: now + expiresIn,
        type: 'access',
      } as JwtPayload,
      this.JWT_SECRET,
      { algorithm: 'HS256' }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        email,
        sessionId,
        iat: now,
        exp: now + (7 * 24 * 60 * 60), // 7 days
        type: 'refresh',
      } as JwtPayload,
      this.JWT_REFRESH_SECRET,
      { algorithm: 'HS256' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  // Verify JWT token
  verifyToken(token: string, type: 'access' | 'refresh' = 'access'): JwtPayload | null {
    try {
      const secret = type === 'access' ? this.JWT_SECRET : this.JWT_REFRESH_SECRET;
      const decoded = jwt.verify(token, secret) as JwtPayload;
      
      if (decoded.type !== type) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  // Register new user
  async register(userData: RegisterRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password, firstName, lastName, phone, dateOfBirth, gender } = userData;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const { hash, salt } = await this.hashPassword(password);

    // Create user
    const newUser = await db
      .insert(schema.users)
      .values({
        email,
        passwordHash: hash,
        salt,
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        isEmailVerified: false,
        isPhoneVerified: false,
        isActive: true,
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const user = newUser[0];

    // Create session
    const session = await this.createSession(user.id, ipAddress, userAgent);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, session.id);

    // Update last login
    await db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    // Log audit event
    await this.logAuditEvent({
      userId: user.id,
      action: 'user_register',
      resource: 'user',
      resourceId: user.id,
      newValues: { email, firstName, lastName },
      ipAddress,
      userAgent,
      success: true,
    });

    // Send verification email (in a real implementation)
    await this.sendEmailVerification(user.id, user.email);

    // Remove sensitive data from response
    const { passwordHash, salt: userSalt, ...safeUser } = user;

    return {
      user: safeUser,
      ...tokens,
    };
  }

  // Login user
  async login(credentials: LoginRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user
    const users = await db
      .select()
      .from(schema.users)
      .where(and(
        eq(schema.users.email, email),
        eq(schema.users.isActive, true)
      ))
      .limit(1);

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Create session
    const session = await this.createSession(user.id, ipAddress, userAgent);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, session.id);

    // Update last login
    await db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    // Log audit event
    await this.logAuditEvent({
      userId: user.id,
      action: 'user_login',
      resource: 'user',
      resourceId: user.id,
      ipAddress,
      userAgent,
      success: true,
    });

    // Remove sensitive data from response
    const { passwordHash, salt, ...safeUser } = user;

    return {
      user: safeUser,
      ...tokens,
    };
  }

  // Create user session
  private async createSession(
    userId: string, 
    ipAddress?: string, 
    userAgent?: string,
    deviceInfo?: any
  ): Promise<UserSession> {
    // Clean up old sessions (keep only MAX_SESSIONS_PER_USER most recent)
    const oldSessions = await db
      .select()
      .from(schema.userSessions)
      .where(and(
        eq(schema.userSessions.userId, userId),
        eq(schema.userSessions.isActive, true)
      ))
      .orderBy(desc(schema.userSessions.createdAt))
      .limit(this.MAX_SESSIONS_PER_USER);

    if (oldSessions.length >= this.MAX_SESSIONS_PER_USER) {
      // Deactivate oldest sessions
      const sessionsToDeactivate = oldSessions.slice(this.MAX_SESSIONS_PER_USER - 1);
      for (const session of sessionsToDeactivate) {
        await db
          .update(schema.userSessions)
          .set({ isActive: false })
          .where(eq(schema.userSessions.id, session.id));
      }
    }

    // Generate session tokens
    const sessionToken = this.generateSecureToken(64);
    const refreshToken = this.generateSecureToken(64);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create new session
    const newSessions = await db
      .insert(schema.userSessions)
      .values({
        userId,
        sessionToken,
        refreshToken,
        deviceInfo: deviceInfo || {},
        ipAddress,
        userAgent,
        isActive: true,
        expiresAt,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
      })
      .returning();

    return newSessions[0];
  }

  // Refresh tokens
  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    // Verify refresh token
    const payload = this.verifyToken(refreshToken, 'refresh');
    if (!payload) {
      throw new Error('Invalid or expired refresh token');
    }

    // Find session
    const sessions = await db
      .select()
      .from(schema.userSessions)
      .where(and(
        eq(schema.userSessions.refreshToken, refreshToken),
        eq(schema.userSessions.isActive, true),
        eq(schema.userSessions.userId, payload.userId)
      ))
      .limit(1);

    if (sessions.length === 0) {
      throw new Error('Session not found or expired');
    }

    const session = sessions[0];

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      await db
        .update(schema.userSessions)
        .set({ isActive: false })
        .where(eq(schema.userSessions.id, session.id));
      throw new Error('Session expired');
    }

    // Find user
    const users = await db
      .select()
      .from(schema.users)
      .where(and(
        eq(schema.users.id, payload.userId),
        eq(schema.users.isActive, true)
      ))
      .limit(1);

    if (users.length === 0) {
      throw new Error('User not found or inactive');
    }

    const user = users[0];

    // Generate new tokens
    const tokens = this.generateTokens(user.id, user.email, session.id);

    // Update session last accessed
    await db
      .update(schema.userSessions)
      .set({ 
        lastAccessedAt: new Date(),
        ipAddress: ipAddress || session.ipAddress,
        userAgent: userAgent || session.userAgent,
      })
      .where(eq(schema.userSessions.id, session.id));

    // Remove sensitive data from response
    const { passwordHash, salt, ...safeUser } = user;

    return {
      user: safeUser,
      ...tokens,
    };
  }

  // Logout user
  async logout(sessionToken: string): Promise<void> {
    await db
      .update(schema.userSessions)
      .set({ isActive: false })
      .where(eq(schema.userSessions.sessionToken, sessionToken));
  }

  // Logout from all devices
  async logoutAll(userId: string): Promise<void> {
    await db
      .update(schema.userSessions)
      .set({ isActive: false })
      .where(eq(schema.userSessions.userId, userId));
  }

  // Forgot password
  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    const { email } = request;

    // Find user
    const users = await db
      .select()
      .from(schema.users)
      .where(and(
        eq(schema.users.email, email),
        eq(schema.users.isActive, true)
      ))
      .limit(1);

    if (users.length === 0) {
      // Don't reveal if user exists or not
      return;
    }

    const user = users[0];

    // Invalidate existing reset tokens
    await db
      .update(schema.passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(schema.passwordResetTokens.userId, user.id));

    // Generate reset token
    const token = this.generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .insert(schema.passwordResetTokens)
      .values({
        userId: user.id,
        token,
        expiresAt,
        isUsed: false,
        createdAt: new Date(),
      });

    // Send reset email (in a real implementation)
    console.log(`Password reset token for ${email}: ${token}`);
  }

  // Reset password
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    const { token, password } = request;

    // Find valid token
    const tokens = await db
      .select()
      .from(schema.passwordResetTokens)
      .where(and(
        eq(schema.passwordResetTokens.token, token),
        eq(schema.passwordResetTokens.isUsed, false),
        // Note: You would need to add a where clause for expiration check
      ))
      .limit(1);

    if (tokens.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const resetToken = tokens[0];

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      throw new Error('Reset token has expired');
    }

    // Find user
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, resetToken.userId))
      .limit(1);

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // Hash new password
    const { hash, salt } = await this.hashPassword(password);

    // Update user password
    await db
      .update(schema.users)
      .set({ 
        passwordHash: hash,
        salt,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));

    // Mark token as used
    await db
      .update(schema.passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(schema.passwordResetTokens.id, resetToken.id));

    // Logout all sessions
    await this.logoutAll(user.id);

    // Log audit event
    await this.logAuditEvent({
      userId: user.id,
      action: 'password_reset',
      resource: 'user',
      resourceId: user.id,
      success: true,
    });
  }

  // Change password
  async changePassword(userId: string, request: ChangePasswordRequest): Promise<void> {
    const { currentPassword, newPassword } = request;

    // Find user
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // Verify current password
    const isValidPassword = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const { hash, salt } = await this.hashPassword(newPassword);

    // Update user password
    await db
      .update(schema.users)
      .set({ 
        passwordHash: hash,
        salt,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));

    // Logout all sessions except current
    // (In a real implementation, you'd identify the current session and keep it)

    // Log audit event
    await this.logAuditEvent({
      userId,
      action: 'password_change',
      resource: 'user',
      resourceId: userId,
      success: true,
    });
  }

  // Send email verification
  private async sendEmailVerification(userId: string, email: string): Promise<void> {
    // Invalidate existing tokens
    await db
      .update(schema.emailVerificationTokens)
      .set({ isVerified: true })
      .where(eq(schema.emailVerificationTokens.userId, userId));

    // Generate verification token
    const token = this.generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db
      .insert(schema.emailVerificationTokens)
      .values({
        userId,
        token,
        email,
        expiresAt,
        isVerified: false,
        createdAt: new Date(),
      });

    // Send verification email (in a real implementation)
    console.log(`Email verification token for ${email}: ${token}`);
  }

  // Log audit events
  private async logAuditEvent(event: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    await db
      .insert(schema.auditLogs)
      .values({
        ...event,
        createdAt: new Date(),
      });
  }

  // Get user sessions
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await db
      .select()
      .from(schema.userSessions)
      .where(and(
        eq(schema.userSessions.userId, userId),
        eq(schema.userSessions.isActive, true)
      ))
      .orderBy(desc(schema.userSessions.lastAccessedAt));

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress || '',
      userAgent: session.userAgent || '',
      isActive: session.isActive,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      lastAccessedAt: session.lastAccessedAt.toISOString(),
    }));
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    await db
      .update(schema.userSessions)
      .set({ isActive: false })
      .where(and(
        eq(schema.userSessions.isActive, true),
        lt(schema.userSessions.expiresAt, new Date())
      ));
  }
}

export const authService = new AuthService();
