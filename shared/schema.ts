import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, jsonb, index, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { number } from 'zod';

// Users table with enhanced security fields
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  salt: varchar("salt", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 10 }), // 'male', 'female', 'other'
  profilePicture: text("profile_picture"),
  isEmailVerified: boolean("is_email_verified").default(false),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  isActive: boolean("is_active").default(true),
  isPremium: boolean("is_premium").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
  deletedAt: timestamp("deleted_at"), // Soft delete
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  phoneIdx: index("users_phone_idx").on(table.phone),
  isActiveIdx: index("users_is_active_idx").on(table.isActive),
  createdAtIdx: index("users_created_at_idx").on(table.createdAt),
}));

// Authentication sessions table
export const userSessions = pgTable("user_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  sessionToken: varchar("session_token", { length: 500 }).notNull().unique(),
  refreshToken: varchar("refresh_token", { length: 500 }).unique(),
  deviceInfo: jsonb("device_info"), // Device type, OS, app version
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  lastAccessedAt: timestamp("last_accessed_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("user_sessions_user_id_idx").on(table.userId),
  sessionTokenIdx: index("user_sessions_token_idx").on(table.sessionToken),
  refreshTokenIdx: index("user_sessions_refresh_token_idx").on(table.refreshToken),
  expiresAtIdx: index("user_sessions_expires_at_idx").on(table.expiresAt),
  isActiveIdx: index("user_sessions_is_active_idx").on(table.isActive),
}));

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
  tokenIdx: index("password_reset_tokens_token_idx").on(table.token),
  expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
}));

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("email_verification_tokens_user_id_idx").on(table.userId),
  tokenIdx: index("email_verification_tokens_token_idx").on(table.token),
  emailIdx: index("email_verification_tokens_email_idx").on(table.email),
}));

// User consent and privacy
export const userConsents = pgTable("user_consents", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  consentType: varchar("consent_type", { length: 50 }).notNull(), // 'privacy_policy', 'terms_of_service', 'data_processing', 'marketing'
  consentVersion: varchar("consent_version", { length: 20 }).notNull(),
  isConsented: boolean("is_consented").notNull(),
  consentedAt: timestamp("consented_at").default(sql`NOW()`),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
}, (table) => ({
  userIdIdx: index("user_consents_user_id_idx").on(table.userId),
  consentTypeIdx: index("user_consents_type_idx").on(table.consentType),
}));

// Audit log for security events
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }), // Nullable for system events
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(), // 'prescription', 'user_profile', 'price_update'
  resourceId: varchar("resource_id", { length: 255 }),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  resourceIdx: index("audit_logs_resource_idx").on(table.resource),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

export const egyptianDrugs = pgTable("egyptian_drugs", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameArabic: varchar("name_arabic", { length: 255 }).notNull(),
  activeIngredient: varchar("active_ingredient", { length: 255 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  descriptionArabic: text("description_arabic"),
  descriptionEnglish: text("description_english"),
  category: varchar("category", { length: 100 }),
  form: varchar("form", { length: 100 }),
  dosing: text("dosing"),
  interactions: jsonb("interactions"),
  contraindications: jsonb("contraindications"),
  sideEffects: jsonb("side_effects"),
  lastPriceUpdate: timestamp("last_price_update").default(sql`NOW()`),
  priceVerified: boolean("price_verified").default(false),
}, (table) => ({
  nameIdx: index("drugs_name_idx").on(table.name),
  nameArabicIdx: index("drugs_name_arabic_idx").on(table.nameArabic),
  activeIngredientIdx: index("drugs_active_ingredient_idx").on(table.activeIngredient),
  categoryIdx: index("drugs_category_idx").on(table.category),
  manufacturerIdx: index("drugs_manufacturer_idx").on(table.manufacturer),
  priceIdx: index("drugs_price_idx").on(table.price),
}));

// Price history tracking table
export const priceHistory = pgTable("price_history", {
  id: integer("id").primaryKey().default(sql`NEXTVAL('price_history_id_seq')`),
  drugId: integer("drug_id").notNull(),
  oldPrice: decimal("old_price", { precision: 10, scale: 2 }),
  newPrice: decimal("new_price", { precision: 10, scale: 2 }).notNull(),
  pharmacy: varchar("pharmacy", { length: 100 }),
  region: varchar("region", { length: 100 }),
  source: varchar("source", { length: 100 }), // "user_update", "pharmacy_api", "scraping"
  verified: boolean("verified").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  drugIdIdx: index("price_history_drug_id_idx").on(table.drugId),
  createdAtIdx: index("price_history_created_at_idx").on(table.createdAt),
  pharmacyIdx: index("price_history_pharmacy_idx").on(table.pharmacy),
}));

// Pharmacy price sources table
export const pharmacySources = pgTable("pharmacy_sources", {
  id: integer("id").primaryKey().default(sql`NEXTVAL('pharmacy_sources_id_seq')`),
  name: varchar("name", { length: 100 }).notNull(),
  website: varchar("website", { length: 255 }),
  apiKey: varchar("api_key", { length: 255 }),
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  region: varchar("region", { length: 100 }),
  reliability: integer("reliability").default(5), // 1-10 rating
}, (table) => ({
  nameIdx: index("pharmacy_sources_name_idx").on(table.name),
  regionIdx: index("pharmacy_sources_region_idx").on(table.region),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
  salt: true,
  firstName: true,
  lastName: true,
  phone: true,
  dateOfBirth: true,
  gender: true,
  profilePicture: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).pick({
  userId: true,
  sessionToken: true,
  refreshToken: true,
  deviceInfo: true,
  ipAddress: true,
  userAgent: true,
  expiresAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).pick({
  userId: true,
  token: true,
  email: true,
  expiresAt: true,
});

export const insertUserConsentSchema = createInsertSchema(userConsents).pick({
  userId: true,
  consentType: true,
  consentVersion: true,
  isConsented: true,
  ipAddress: true,
  userAgent: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  action: true,
  resource: true,
  resourceId: true,
  oldValues: true,
  newValues: true,
  ipAddress: true,
  userAgent: true,
  success: true,
  errorMessage: true,
});

// Validation schemas for authentication
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(100),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(100),
  phone: z.string().regex(/^[\+]?[1-9][\d\s\-\(\)]*$/, "Invalid phone number").optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(100).optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(100).optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d\s\-\(\)]*$/, "Invalid phone number").optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

// JWT Payload schema
export const jwtPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  sessionId: z.string(),
  iat: z.number(),
  exp: z.number(),
  type: z.enum(["access", "refresh"]),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertUserConsent = z.infer<typeof insertUserConsentSchema>;
export type UserConsent = typeof userConsents.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

// Request types
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

// Response types
export interface AuthResponse {
  user: Omit<User, "passwordHash" | "salt">;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
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

export const insertEgyptianDrugSchema = createInsertSchema(egyptianDrugs);
export const insertPriceHistorySchema = createInsertSchema(priceHistory);
export const insertPharmacySourceSchema = createInsertSchema(pharmacySources);

// Validation schemas for price updates
export const updatePriceSchema = z.object({
  drugId: z.number(),
  newPrice: z.number().positive().max(99999.99),
  pharmacy: z.string().min(1).max(100).optional(),
  region: z.string().min(1).max(100).optional(),
  source: z.enum(["user_update", "pharmacy_api", "scraping"]).default("user_update"),
  notes: z.string().max(500).optional(),
});

export const bulkPriceUpdateSchema = z.object({
  updates: z.array(updatePriceSchema).max(100), // Limit to 100 updates at once
});

export type InsertEgyptianDrug = z.infer<typeof insertEgyptianDrugSchema>;
export type EgyptianDrug = typeof egyptianDrugs.$inferSelect;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPharmacySource = z.infer<typeof insertPharmacySourceSchema>;
export type PharmacySource = typeof pharmacySources.$inferSelect;
export type UpdatePrice = z.infer<typeof updatePriceSchema>;
export type BulkPriceUpdate = z.infer<typeof bulkPriceUpdateSchema>;

export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo?: {
    platform: string;
    os: string;
    appVersion: string;
    deviceId: string;
  };
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  lastAccessedAt: string;
}

// User allergies table
export const userAllergies = pgTable("user_allergies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  allergenType: varchar("allergen_type", { length: 50 }).notNull(), // 'drug', 'food', 'environmental'
  allergenName: varchar("allergen_name", { length: 255 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(), // 'mild', 'moderate', 'severe'
  reaction: text("reaction"), // Description of allergic reaction
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("user_allergies_user_id_idx").on(table.userId),
  allergenTypeIdx: index("user_allergies_type_idx").on(table.allergenType),
  allergenNameIdx: index("user_allergies_name_idx").on(table.allergenName),
  isActiveIdx: index("user_allergies_is_active_idx").on(table.isActive),
}));

// User prescriptions table
export const userPrescriptions = pgTable("user_prescriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  drugId: integer("drug_id").notNull(),
  drugName: varchar("drug_name", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 255 }).notNull(),
  frequency: varchar("frequency", { length: 255 }).notNull(),
  duration: varchar("duration", { length: 255 }),
  prescribedBy: varchar("prescribed_by", { length: 255 }),
  prescribedDate: timestamp("prescribed_date"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("user_prescriptions_user_id_idx").on(table.userId),
  drugIdIdx: index("user_prescriptions_drug_id_idx").on(table.drugId),
  isActiveIdx: index("user_prescriptions_is_active_idx").on(table.isActive),
  prescribedDateIdx: index("user_prescriptions_prescribed_date_idx").on(table.prescribedDate),
}));

// Drug interaction database
export const drugInteractions = pgTable("drug_interactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  drug1Id: integer("drug_1_id").notNull(),
  drug2Id: integer("drug_2_id").notNull(),
  severity: varchar("severity", { length: 20 }).notNull(), // 'minor', 'moderate', 'major', 'contraindicated'
  interactionType: varchar("interaction_type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation"),
  evidenceLevel: varchar("evidence_level", { length: 20 }).default('moderate'), // 'theoretical', 'limited', 'moderate', 'strong'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  drug1IdIdx: index("drug_interactions_drug_1_id_idx").on(table.drug1Id),
  drug2IdIdx: index("drug_interactions_drug_2_id_idx").on(table.drug2Id),
  severityIdx: index("drug_interactions_severity_idx").on(table.severity),
  isActiveIdx: index("drug_interactions_is_active_idx").on(table.isActive),
}));

// User settings table
export const userSettings = pgTable("user_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  enableDrugInteractionChecker: boolean("enable_drug_interaction_checker").default(true),
  enableAllergyAlerts: boolean("enable_allergy_alerts").default(true),
  enableDosageCalculator: boolean("enable_dosage_calculator").default(true),
  preferredLanguage: varchar("preferred_language", { length: 10 }).default('en'),
  preferredUnits: varchar("preferred_units", { length: 10 }).default('metric'), // 'metric', 'imperial'
  notificationsEnabled: boolean("notifications_enabled").default(true),
  darkMode: boolean("dark_mode").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("user_settings_user_id_idx").on(table.userId),
}));

// Prescription backup and sync table
export const prescriptionBackups = pgTable("prescription_backups", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  backupData: jsonb("backup_data").notNull(), // Complete prescription data
  backupType: varchar("backup_type", { length: 50 }).notNull(), // 'manual', 'auto', 'sync'
  deviceId: varchar("device_id", { length: 255 }), // Source device identifier
  cloudProvider: varchar("cloud_provider", { length: 100 }), // 'google_drive', 'icloud', 'dropbox', 'aws'
  cloudPath: varchar("cloud_path", { length: 500 }), // Path in cloud storage
  checksum: varchar("checksum", { length: 64 }), // Data integrity verification
  isEncrypted: boolean("is_encrypted").default(true),
  backupSize: integer("backup_size"), // Size in bytes
  syncStatus: varchar("sync_status", { length: 50 }).default('pending'), // 'pending', 'syncing', 'completed', 'failed'
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("prescription_backups_user_id_idx").on(table.userId),
  backupTypeIdx: index("prescription_backups_type_idx").on(table.backupType),
  syncStatusIdx: index("prescription_backups_sync_status_idx").on(table.syncStatus),
  createdAtIdx: index("prescription_backups_created_at_idx").on(table.createdAt),
}));

// Usage analytics table
export const usageAnalytics = pgTable("usage_analytics", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(), // 'scan', 'search', 'export', 'backup', 'interaction_check'
  eventName: varchar("event_name", { length: 255 }).notNull(),
  eventData: jsonb("event_data"), // Additional event-specific data
  sessionId: varchar("session_id", { length: 255 }),
  deviceId: varchar("device_id", { length: 255 }),
  appVersion: varchar("app_version", { length: 50 }),
  platform: varchar("platform", { length: 50 }), // 'ios', 'android', 'web'
  duration: integer("duration"), // Event duration in milliseconds
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  location: jsonb("location"), // Geolocation data
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("usage_analytics_user_id_idx").on(table.userId),
  eventTypeIdx: index("usage_analytics_event_type_idx").on(table.eventType),
  sessionIdIdx: index("usage_analytics_session_id_idx").on(table.sessionId),
  createdAtIdx: index("usage_analytics_created_at_idx").on(table.createdAt),
}));

// Price trend analysis table
export const priceTrends = pgTable("price_trends", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  drugId: integer("drug_id").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  pharmacy: varchar("pharmacy", { length: 255 }),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  previousPrice: decimal("previous_price", { precision: 10, scale: 2 }),
  priceChange: decimal("price_change", { precision: 10, scale: 2 }),
  priceChangePercent: decimal("price_change_percent", { precision: 5, scale: 2 }),
  trendDirection: varchar("trend_direction", { length: 20 }).notNull(), // 'up', 'down', 'stable'
  trendStrength: varchar("trend_strength", { length: 20 }).notNull(), // 'weak', 'moderate', 'strong'
  predictedPrice: decimal("predicted_price", { precision: 10, scale: 2 }),
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // Prediction confidence 0-1
  dataPoints: integer("data_points").default(1), // Number of data points used for analysis
  analysisPeriod: varchar("analysis_period", { length: 50 }).notNull(), // '7d', '30d', '90d', '1y'
  lastUpdated: timestamp("last_updated").default(sql`NOW()`),
  createdAt: timestamp("created_at").default(sql`NOW()`),
}, (table) => ({
  drugIdIdx: index("price_trends_drug_id_idx").on(table.drugId),
  regionIdx: index("price_trends_region_idx").on(table.region),
  pharmacyIdx: index("price_trends_pharmacy_idx").on(table.pharmacy),
  trendDirectionIdx: index("price_trends_direction_idx").on(table.trendDirection),
  lastUpdatedIdx: index("price_trends_last_updated_idx").on(table.lastUpdated),
}));

// Market intelligence table
export const marketIntelligence = pgTable("market_intelligence", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  drugId: integer("drug_id").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  availabilityStatus: varchar("availability_status", { length: 50 }).notNull(), // 'available', 'limited', 'out_of_stock', 'discontinued'
  stockLevel: integer("stock_level"), // Current stock level if available
  demandLevel: varchar("demand_level", { length: 50 }).notNull(), // 'low', 'medium', 'high', 'very_high'
  seasonality: varchar("seasonality", { length: 50 }), // 'high_season', 'low_season', 'stable'
  competitorPricing: jsonb("competitor_pricing"), // Competitor price comparison
  marketShare: decimal("market_share", { precision: 5, scale: 2 }),
  forecastDemand: integer("forecast_demand"), // Demand forecast for next period
  recommendedAction: varchar("recommended_action", { length: 255 }),
  insights: jsonb("insights"), // Additional market insights
  dataSource: varchar("data_source", { length: 100 }), // 'pharmacy_api', 'scraping', 'user_reports'
  reliability: integer("reliability").default(5), // Data reliability score 1-10
  lastChecked: timestamp("last_checked").default(sql`NOW()`),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  drugIdIdx: index("market_intelligence_drug_id_idx").on(table.drugId),
  regionIdx: index("market_intelligence_region_idx").on(table.region),
  availabilityStatusIdx: index("market_intelligence_status_idx").on(table.availabilityStatus),
  demandLevelIdx: index("market_intelligence_demand_idx").on(table.demandLevel),
  lastCheckedIdx: index("market_intelligence_last_checked_idx").on(table.lastChecked),
}));

// Export history table
export const exportHistory = pgTable("export_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  exportType: varchar("export_type", { length: 50 }).notNull(), // 'pdf', 'email', 'print', 'csv'
  contentType: varchar("content_type", { length: 100 }).notNull(), // 'prescription_history', 'analysis_results', 'price_comparison'
  contentData: jsonb("content_data").notNull(), // The exported data
  fileName: varchar("file_name", { length: 255 }),
  fileSize: integer("file_size"), // Size in bytes
  format: varchar("format", { length: 50 }), // 'pdf', 'csv', 'json'
  deliveryMethod: varchar("delivery_method", { length: 100 }), // 'download', 'email', 'print'
  recipientEmail: varchar("recipient_email", { length: 255 }),
  status: varchar("status", { length: 50 }).default('pending'), // 'pending', 'processing', 'completed', 'failed'
  downloadUrl: varchar("download_url", { length: 500 }), // For downloadable exports
  expiresAt: timestamp("expires_at"), // When download link expires
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("export_history_user_id_idx").on(table.userId),
  exportTypeIdx: index("export_history_type_idx").on(table.exportType),
  statusIdx: index("export_history_status_idx").on(table.status),
  createdAtIdx: index("export_history_created_at_idx").on(table.createdAt),
}));

// Dosage guidelines table
export const dosageGuidelines = pgTable("dosage_guidelines", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  drugId: integer("drug_id").notNull(),
  ageGroup: varchar("age_group", { length: 50 }).notNull(), // 'neonate', 'infant', 'child', 'adolescent', 'adult', 'elderly'
  weightRange: varchar("weight_range", { length: 50 }), // e.g., '10-20kg', '20-40kg'
  condition: varchar("condition", { length: 255 }), // Specific condition or indication
  dosagePerKg: varchar("dosage_per_kg", { length: 255 }), // e.g., '5-10mg/kg/day'
  maxDailyDose: varchar("max_daily_dose", { length: 255 }),
  frequency: varchar("frequency", { length: 255 }),
  duration: varchar("duration", { length: 255 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  drugIdIdx: index("dosage_guidelines_drug_id_idx").on(table.drugId),
  ageGroupIdx: index("dosage_guidelines_age_group_idx").on(table.ageGroup),
  isActiveIdx: index("dosage_guidelines_is_active_idx").on(table.isActive),
}));

// Schema exports and validation schemas
export const insertUserAllergySchema = createInsertSchema(userAllergies).pick({
  userId: true,
  allergenType: true,
  allergenName: true,
  severity: true,
  reaction: true,
  notes: true,
});

export const insertUserPrescriptionSchema = createInsertSchema(userPrescriptions).pick({
  userId: true,
  drugId: true,
  drugName: true,
  dosage: true,
  frequency: true,
  duration: true,
  prescribedBy: true,
  prescribedDate: true,
  notes: true,
});

export const insertDrugInteractionSchema = createInsertSchema(drugInteractions).pick({
  drug1Id: true,
  drug2Id: true,
  severity: true,
  interactionType: true,
  description: true,
  recommendation: true,
  evidenceLevel: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  userId: true,
  enableDrugInteractionChecker: true,
  enableAllergyAlerts: true,
  enableDosageCalculator: true,
  preferredLanguage: true,
  preferredUnits: true,
  notificationsEnabled: true,
  darkMode: true,
});

export const insertDosageGuidelineSchema = createInsertSchema(dosageGuidelines).pick({
  drugId: true,
  ageGroup: true,
  weightRange: true,
  condition: true,
  dosagePerKg: true,
  maxDailyDose: true,
  frequency: true,
  duration: true,
  notes: true,
});

// New schemas for advanced features
export const insertPrescriptionBackupSchema = createInsertSchema(prescriptionBackups).pick({
  userId: true,
  backupData: true,
  backupType: true,
  deviceId: true,
  cloudProvider: true,
  cloudPath: true,
  checksum: true,
  isEncrypted: true,
  backupSize: true,
  syncStatus: true,
  lastSyncAt: true,
});

export const insertUsageAnalyticsSchema = createInsertSchema(usageAnalytics).pick({
  userId: true,
  eventType: true,
  eventName: true,
  eventData: true,
  sessionId: true,
  deviceId: true,
  appVersion: true,
  platform: true,
  duration: true,
  success: true,
  errorMessage: true,
  ipAddress: true,
  userAgent: true,
  location: true,
});

export const insertPriceTrendSchema = createInsertSchema(priceTrends).pick({
  drugId: true,
  region: true,
  pharmacy: true,
  currentPrice: true,
  previousPrice: true,
  priceChange: true,
  priceChangePercent: true,
  trendDirection: true,
  trendStrength: true,
  predictedPrice: true,
  confidence: true,
  dataPoints: true,
  analysisPeriod: true,
  lastUpdated: true,
});

export const insertMarketIntelligenceSchema = createInsertSchema(marketIntelligence).pick({
  drugId: true,
  region: true,
  availabilityStatus: true,
  stockLevel: true,
  demandLevel: true,
  seasonality: true,
  competitorPricing: true,
  marketShare: true,
  forecastDemand: true,
  recommendedAction: true,
  insights: true,
  dataSource: true,
  reliability: true,
  lastChecked: true,
});

export const insertExportHistorySchema = createInsertSchema(exportHistory).pick({
  userId: true,
  exportType: true,
  contentType: true,
  contentData: true,
  fileName: true,
  fileSize: true,
  format: true,
  deliveryMethod: true,
  recipientEmail: true,
  status: true,
  downloadUrl: true,
  expiresAt: true,
  errorMessage: true,
});

// Drug reviews table
export const drugReviews = pgTable("drug_reviews", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  drugId: integer("drug_id").notNull(),
  drugName: varchar("drug_name", { length: 255 }).notNull(),
  activeIngredient: varchar("active_ingredient", { length: 255 }),
  dosage: varchar("dosage", { length: 255 }),
  frequency: varchar("frequency", { length: 255 }),
  duration: varchar("duration", { length: 255 }),
  effectiveness: varchar("effectiveness", { length: 20 }).notNull(), // 'very_poor', 'poor', 'average', 'good', 'very_good', 'excellent'
  sideEffects: jsonb("side_effects"), // Array of side effects
  interactions: jsonb("interactions"), // Array of interaction details
  rating: integer("rating").notNull(), // 1-6 scale
  review: text("review"),
  pros: text("pros"),
  cons: text("cons"),
  isVerified: boolean("is_verified").default(false),
  helpful: integer("helpful").default(0), // Number of helpful votes
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("drug_reviews_user_id_idx").on(table.userId),
  drugIdIdx: index("drug_reviews_drug_id_idx").on(table.drugId),
  ratingIdx: index("drug_reviews_rating_idx").on(table.rating),
  effectivenessIdx: index("drug_reviews_effectiveness_idx").on(table.effectiveness),
  createdAtIdx: index("drug_reviews_created_at_idx").on(table.createdAt),
}));

// Medical Q&A table
export const medicalQuestions = pgTable("medical_questions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  drugId: integer("drug_id"),
  drugName: varchar("drug_name", { length: 255 }),
  question: text("question").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'efficacy', 'safety', 'usage', 'interactions', 'side_effects', 'alternatives'
  answer: text("answer"),
  isAnswered: boolean("is_answered").default(false),
  askedBy: varchar("asked_by", { length: 255 }),
  answeredBy: varchar("answered_by", { length: 255 }),
  helpful: integer("helpful").default(0), // Number of helpful votes
  views: integer("views").default(0), // Number of views
  isModerated: boolean("is_moderated").default(false),
  isPublic: boolean("is_public").default(true),
  tags: jsonb("tags"), // Array of tags
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("medical_questions_user_id_idx").on(table.userId),
  drugIdIdx: index("medical_questions_drug_id_idx").on(table.drugId),
  categoryIdx: index("medical_questions_category_idx").on(table.category),
  isAnsweredIdx: index("medical_questions_is_answered_idx").on(table.isAnswered),
  isPublicIdx: index("medical_questions_is_public_idx").on(table.isPublic),
  createdAtIdx: index("medical_questions_created_at_idx").on(table.createdAt),
}));

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  issueType: varchar("issue_type", { length: 50 }).notNull(), // 'bug', 'feature_request', 'question', 'feedback', 'complaint'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }),
  priority: varchar("priority", { length: 20 }).default('medium'), // 'low', 'medium', 'high', 'critical'
  status: varchar("status", { length: 20 }).default('open'), // 'open', 'in_progress', 'resolved', 'closed', 'reopened', 'on_hold'
  assignedTo: varchar("assigned_to", { length: 255 }),
  assignedAt: timestamp("assigned_at"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by", { length: 255 }),
  dueDate: timestamp("due_date"),
  resolutionTime: integer("resolution_time"), // Resolution time in minutes
  attachments: jsonb("attachments"), // Array of attachment URLs
  internalNotes: text("internal_notes"),
  userSatisfaction: integer("user_satisfaction"), // 1-5 rating
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("support_tickets_user_id_idx").on(table.userId),
  issueTypeIdx: index("support_tickets_issue_type_idx").on(table.issueType),
  statusIdx: index("support_tickets_status_idx").on(table.status),
  priorityIdx: index("support_tickets_priority_idx").on(table.priority),
  assignedToIdx: index("support_tickets_assigned_to_idx").on(table.assignedTo),
  createdAtIdx: index("support_tickets_created_at_idx").on(table.createdAt),
}));

// Help requests table
export const helpRequests = pgTable("help_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  query: varchar("query", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'general', 'drug_specific', 'usage_help', 'interaction_check', 'dosage_help', 'allergy_help', 'backup_help', 'export_help', 'update_help', 'account_help', 'security_help', 'technical_support'
  question: text("question").notNull(),
  context: jsonb("context"), // Additional context data
  metadata: jsonb("metadata"), // Request metadata
  response: text("response"),
  isAnswered: boolean("is_answered").default(false),
  answeredBy: varchar("answered_by", { length: 255 }),
  answeredAt: timestamp("answered_at"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  assignedAt: timestamp("assigned_at"),
  priority: varchar("priority", { length: 20 }).default('medium'),
  status: varchar("status", { length: 20 }).default('open'), // 'open', 'in_progress', 'resolved', 'closed'
  helpful: integer("helpful").default(0), // Number of helpful votes
  sources: jsonb("sources"), // Response sources
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  userIdIdx: index("help_requests_user_id_idx").on(table.userId),
  categoryIdx: index("help_requests_category_idx").on(table.category),
  statusIdx: index("help_requests_status_idx").on(table.status),
  priorityIdx: index("help_requests_priority_idx").on(table.priority),
  isAnsweredIdx: index("help_requests_is_answered_idx").on(table.isAnswered),
  createdAtIdx: index("help_requests_created_at_idx").on(table.createdAt),
}));

// Help responses table
export const helpResponses = pgTable("help_responses", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  requestId: varchar("request_id", { length: 255 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  helpful: integer("helpful").default(0),
  sources: jsonb("sources"), // Array of source objects
  isAutomated: boolean("is_automated").default(false),
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // Response confidence 0-1
  respondedBy: varchar("responded_by", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
}, (table) => ({
  requestIdIdx: index("help_responses_request_id_idx").on(table.requestId),
  categoryIdx: index("help_responses_category_idx").on(table.category),
  createdAtIdx: index("help_responses_created_at_idx").on(table.createdAt),
}));

export const insertDrugReviewSchema = createInsertSchema(drugReviews).pick({
  userId: true,
  drugId: true,
  drugName: true,
  activeIngredient: true,
  dosage: true,
  frequency: true,
  duration: true,
  effectiveness: true,
  sideEffects: true,
  interactions: true,
  rating: true,
  review: true,
  pros: true,
  cons: true,
});

export const insertMedicalQuestionSchema = createInsertSchema(medicalQuestions).pick({
  userId: true,
  drugId: true,
  drugName: true,
  question: true,
  category: true,
  answer: true,
  askedBy: true,
  answeredBy: true,
  tags: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).pick({
  userId: true,
  issueType: true,
  title: true,
  description: true,
  category: true,
  priority: true,
  attachments: true,
  internalNotes: true,
});

export const insertHelpRequestSchema = createInsertSchema(helpRequests).pick({
  userId: true,
  query: true,
  category: true,
  question: true,
  context: true,
  metadata: true,
  response: true,
  answeredBy: true,
  assignedTo: true,
  priority: true,
  sources: true,
});

export const insertHelpResponseSchema = createInsertSchema(helpResponses).pick({
  requestId: true,
  answer: true,
  category: true,
  sources: true,
  isAutomated: true,
  confidence: true,
  respondedBy: true,
});

// Validation schemas for advanced features
export const createUserAllergySchema = z.object({
  allergenType: z.enum(['drug', 'food', 'environmental']),
  allergenName: z.string().min(1).max(255),
  severity: z.enum(['mild', 'moderate', 'severe']),
  reaction: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
});

export const createUserPrescriptionSchema = z.object({
  drugId: z.number(),
  drugName: z.string().min(1).max(255),
  dosage: z.string().min(1).max(255),
  frequency: z.string().min(1).max(255),
  duration: z.string().max(255).optional(),
  prescribedBy: z.string().max(255).optional(),
  prescribedDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateUserSettingsSchema = z.object({
  enableDrugInteractionChecker: z.boolean().optional(),
  enableAllergyAlerts: z.boolean().optional(),
  enableDosageCalculator: z.boolean().optional(),
  preferredLanguage: z.string().max(10).optional(),
  preferredUnits: z.enum(['metric', 'imperial']).optional(),
  notificationsEnabled: z.boolean().optional(),
  darkMode: z.boolean().optional(),
});

export const dosageCalculationSchema = z.object({
  drugId: z.number(),
  age: z.number().min(0).max(150),
  weight: z.number().min(0).max(500),
  ageGroup: z.enum(['neonate', 'infant', 'child', 'adolescent', 'adult', 'elderly']).optional(),
  condition: z.string().max(255).optional(),
});

export const drugInteractionCheckSchema = z.object({
  drugIds: z.array(z.number()).min(2).max(20), // Check between 2-20 drugs
});

// New validation schemas for additional features
export const createPrescriptionBackupSchema = z.object({
  backupType: z.enum(['manual', 'auto', 'sync']),
  cloudProvider: z.enum(['google_drive', 'icloud', 'dropbox', 'aws']).optional(),
  deviceId: z.string().max(255).optional(),
  isEncrypted: z.boolean().default(true),
});

export const createUsageAnalyticsSchema = z.object({
  eventType: z.enum(['scan', 'search', 'export', 'backup', 'interaction_check', 'dosage_calculation', 'allergy_check']),
  eventName: z.string().min(1).max(255),
  eventData: z.any().optional(),
  sessionId: z.string().max(255).optional(),
  deviceId: z.string().max(255).optional(),
  appVersion: z.string().max(50).optional(),
  platform: z.enum(['ios', 'android', 'web']).optional(),
  duration: z.number().optional(),
  success: z.boolean().default(true),
  errorMessage: z.string().max(1000).optional(),
  location: z.any().optional(),
});

export const createPriceTrendSchema = z.object({
  drugId: z.number(),
  region: z.string().min(1).max(100),
  pharmacy: z.string().max(255).optional(),
  currentPrice: z.number().positive(),
  previousPrice: z.number().positive().optional(),
  trendDirection: z.enum(['up', 'down', 'stable']),
  trendStrength: z.enum(['weak', 'moderate', 'strong']),
  predictedPrice: z.number().positive().optional(),
  confidence: z.number().min(0).max(1).optional(),
  dataPoints: z.number().min(1).default(1),
  analysisPeriod: z.enum(['7d', '30d', '90d', '1y']),
});

export const createMarketIntelligenceSchema = z.object({
  drugId: z.number(),
  region: z.string().min(1).max(100),
  availabilityStatus: z.enum(['available', 'limited', 'out_of_stock', 'discontinued']),
  stockLevel: z.number().min(0).optional(),
  demandLevel: z.enum(['low', 'medium', 'high', 'very_high']),
  seasonality: z.enum(['high_season', 'low_season', 'stable']).optional(),
  competitorPricing: z.any().optional(),
  marketShare: z.number().min(0).max(100).optional(),
  forecastDemand: z.number().min(0).optional(),
  recommendedAction: z.string().max(255).optional(),
  insights: z.any().optional(),
  dataSource: z.enum(['pharmacy_api', 'scraping', 'user_reports']),
  reliability: z.number().min(1).max(10).default(5),
});

export const createExportHistorySchema = z.object({
  exportType: z.enum(['pdf', 'email', 'print', 'csv']),
  contentType: z.enum(['prescription_history', 'analysis_results', 'price_comparison', 'usage_analytics']),
  contentData: z.any(),
  fileName: z.string().max(255).optional(),
  format: z.enum(['pdf', 'csv', 'json']),
  deliveryMethod: z.enum(['download', 'email', 'print']),
  recipientEmail: z.string().email().optional(),
  expiresAt: z.string().datetime().optional(),
});

// Types
export type InsertUserAllergy = z.infer<typeof insertUserAllergySchema>;
export type UserAllergy = typeof userAllergies.$inferSelect;
export type InsertUserPrescription = z.infer<typeof insertUserPrescriptionSchema>;
export type UserPrescription = typeof userPrescriptions.$inferSelect;
export type InsertDrugInteraction = z.infer<typeof insertDrugInteractionSchema>;
export type DrugInteraction = typeof drugInteractions.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertDosageGuideline = z.infer<typeof insertDosageGuidelineSchema>;
export type DosageGuideline = typeof dosageGuidelines.$inferSelect;

// New types for additional features
export type InsertPrescriptionBackup = z.infer<typeof insertPrescriptionBackupSchema>;
export type PrescriptionBackup = typeof prescriptionBackups.$inferSelect;
export type InsertUsageAnalytics = z.infer<typeof insertUsageAnalyticsSchema>;
export type UsageAnalytics = typeof usageAnalytics.$inferSelect;
export type InsertPriceTrend = z.infer<typeof insertPriceTrendSchema>;
export type PriceTrend = typeof priceTrends.$inferSelect;
export type InsertMarketIntelligence = z.infer<typeof insertMarketIntelligenceSchema>;
export type MarketIntelligence = typeof marketIntelligence.$inferSelect;
export type InsertExportHistory = z.infer<typeof insertExportHistorySchema>;
export type ExportHistory = typeof exportHistory.$inferSelect;

// Request types
export type CreateUserAllergy = z.infer<typeof createUserAllergySchema>;
export type CreateUserPrescription = z.infer<typeof createUserPrescriptionSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type DosageCalculation = z.infer<typeof dosageCalculationSchema>;
export type DrugInteractionCheck = z.infer<typeof drugInteractionCheckSchema>;

// New request types
export type CreatePrescriptionBackup = z.infer<typeof createPrescriptionBackupSchema>;
export type CreateUsageAnalytics = z.infer<typeof createUsageAnalyticsSchema>;
export type CreatePriceTrend = z.infer<typeof createPriceTrendSchema>;
export type CreateMarketIntelligence = z.infer<typeof createMarketIntelligenceSchema>;
export type CreateExportHistory = z.infer<typeof createExportHistorySchema>;

// Response types
export interface DrugInteractionResult {
  drug1Id: number;
  drug1Name: string;
  drug2Id: number;
  drug2Name: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  interactionType: string;
  description: string;
  recommendation?: string;
  evidenceLevel: 'theoretical' | 'limited' | 'moderate' | 'strong';
}

export interface DosageCalculationResult {
  drugName: string;
  calculatedDose: number;
  unit: string;
  frequency: string;
  maxDailyDose?: number;
  notes: string;
  ageGroup: string;
  weightRange?: string;
}

export interface AllergyAlert {
  allergenName: string;
  allergenType: 'drug' | 'food' | 'environmental';
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  recommendation: string;
}
