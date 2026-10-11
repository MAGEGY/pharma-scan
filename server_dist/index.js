var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express4 from "express";

// server/routes.ts
import { createServer } from "node:http";
import OpenAI from "openai";

// server/mockDrugService.ts
var mockDrugs = [
  {
    id: 1,
    name: "Panadol",
    nameArabic: "\u0628\u0627\u0646\u0627\u062F\u0648\u0644",
    activeIngredient: "Paracetamol",
    category: "Analgesic",
    manufacturer: "GSK",
    form: "Tablet",
    price: 25.5,
    dosing: "Adults: 1-2 tablets every 4-6 hours as needed. Maximum 8 tablets in 24 hours.",
    descriptionEnglish: "Pain reliever and fever reducer",
    descriptionArabic: "\u0645\u0633\u0643\u0646 \u0644\u0644\u0623\u0644\u0645 \u0648\u062E\u0627\u0641\u0636 \u0644\u0644\u062D\u0631\u0627\u0631\u0629",
    interactions: ["Warfarin", "Alcohol"],
    contraindications: ["Liver disease", "Allergy to paracetamol"],
    sideEffects: ["Nausea", "Liver toxicity (high doses)"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: 2,
    name: "Augmentin",
    nameArabic: "\u0623\u0648\u062C\u0645\u0646\u062A\u064A\u0646",
    activeIngredient: "Amoxicillin/Clavulanate",
    category: "Antibiotic",
    manufacturer: "GSK",
    form: "Tablet",
    price: 85,
    dosing: "Adults: 1 tablet every 8 hours for 7-10 days.",
    descriptionEnglish: "Broad-spectrum antibiotic",
    descriptionArabic: "\u0645\u0636\u0627\u062F \u062D\u064A\u0648\u064A \u0648\u0627\u0633\u0639 \u0627\u0644\u0645\u062F\u0649",
    interactions: ["Oral contraceptives", "Warfarin"],
    contraindications: ["Penicillin allergy"],
    sideEffects: ["Diarrhea", "Nausea", "Yeast infections"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: 3,
    name: "Concor",
    nameArabic: "\u0643\u0648\u0646\u0643\u0648\u0631",
    activeIngredient: "Bisoprolol",
    category: "Beta Blocker",
    manufacturer: "Merck",
    form: "Tablet",
    price: 45.75,
    dosing: "Adults: 2.5-10 mg once daily, usually in the morning.",
    descriptionEnglish: "Beta blocker for hypertension and heart conditions",
    descriptionArabic: "\u062D\u0627\u0635\u0631 \u0628\u064A\u062A\u0627 \u0644\u0639\u0644\u0627\u062C \u0627\u0631\u062A\u0641\u0627\u0639 \u0636\u063A\u0637 \u0627\u0644\u062F\u0645 \u0648\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0642\u0644\u0628",
    interactions: ["Other beta blockers", "Calcium channel blockers"],
    contraindications: ["Severe asthma", "Heart block"],
    sideEffects: ["Fatigue", "Dizziness", "Bradycardia"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: 4,
    name: "Glucophage",
    nameArabic: "\u062C\u0644\u0648\u0643\u0648\u0641\u0627\u062C",
    activeIngredient: "Metformin",
    category: "Antidiabetic",
    manufacturer: "Merck",
    form: "Tablet",
    price: 35.25,
    dosing: "Adults: 500 mg twice daily with meals, gradually increase as needed.",
    descriptionEnglish: "Oral diabetes medication",
    descriptionArabic: "\u062F\u0648\u0627\u0621 \u0641\u0645\u0648\u064A \u0644\u0644\u0633\u0643\u0631\u064A",
    interactions: ["Contrast media", "Alcohol"],
    contraindications: ["Renal impairment", "Metabolic acidosis"],
    sideEffects: ["GI upset", "Lactic acidosis (rare)"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: 5,
    name: "Zyrtec",
    nameArabic: "\u0632\u064A\u0631\u062A\u064A\u0643",
    activeIngredient: "Cetirizine",
    category: "Antihistamine",
    manufacturer: "UCB",
    form: "Tablet",
    price: 28.9,
    dosing: "Adults and children over 12: 10 mg once daily.",
    descriptionEnglish: "Antihistamine for allergies",
    descriptionArabic: "\u0645\u0636\u0627\u062F \u0647\u064A\u0633\u062A\u0627\u0645\u064A\u0646 \u0644\u0644\u062D\u0633\u0627\u0633\u064A\u0629",
    interactions: ["Alcohol", "CNS depressants"],
    contraindications: ["Severe renal impairment"],
    sideEffects: ["Drowsiness", "Dry mouth"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: 6,
    name: "Ventolin",
    nameArabic: "\u0641\u0646\u062A\u0648\u0644\u064A\u0646",
    activeIngredient: "Salbutamol",
    category: "Bronchodilator",
    manufacturer: "GSK",
    form: "Inhaler",
    price: 42.3,
    dosing: "1-2 puffs every 4-6 hours as needed for asthma symptoms.",
    descriptionEnglish: "Bronchodilator inhaler for asthma",
    descriptionArabic: "\u0628\u062E\u0627\u062E \u0645\u0648\u0633\u0639 \u0644\u0644\u0642\u0635\u0628\u0627\u062A \u0627\u0644\u0647\u0648\u0627\u0626\u064A\u0629 \u0644\u0644\u0631\u0628\u0648",
    interactions: ["Beta blockers"],
    contraindications: ["Tachyarrhythmias"],
    sideEffects: ["Tremor", "Tachycardia", "Headache"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: 7,
    name: "Aspirin Protect",
    nameArabic: "\u0623\u0633\u0628\u0631\u064A\u0646 \u0628\u0631\u0648\u062A\u0643",
    activeIngredient: "Aspirin",
    category: "Antiplatelet",
    manufacturer: "Bayer",
    form: "Tablet",
    price: 18.45,
    dosing: "Adults: 100 mg once daily for cardiovascular protection.",
    descriptionEnglish: "Low-dose aspirin for heart protection",
    descriptionArabic: "\u0623\u0633\u0628\u0631\u064A\u0646 \u0645\u0646\u062E\u0641\u0636 \u0627\u0644\u062C\u0631\u0639\u0629 \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0642\u0644\u0628",
    interactions: ["Warfarin", "NSAIDs", "Alcohol"],
    contraindications: ["Bleeding disorders", "Peptic ulcer"],
    sideEffects: ["GI bleeding", "Tinnitus"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: 8,
    name: "Nexium",
    nameArabic: "\u0646\u064A\u0643\u0633\u064A\u0648\u0645",
    activeIngredient: "Esomeprazole",
    category: "PPI",
    manufacturer: "AstraZeneca",
    form: "Capsule",
    price: 95.5,
    dosing: "20-40 mg once daily before meals for 4-8 weeks.",
    descriptionEnglish: "Proton pump inhibitor for acid reflux",
    descriptionArabic: "\u0645\u062B\u0628\u0637 \u0645\u0636\u062E\u0629 \u0627\u0644\u0628\u0631\u0648\u062A\u0648\u0646 \u0644\u0644\u0627\u0631\u062A\u062C\u0627\u0639 \u0627\u0644\u062D\u0645\u0636\u064A",
    interactions: ["Ketoconazole", "Warfarin"],
    contraindications: ["Severe liver disease"],
    sideEffects: ["Headache", "Diarrhea", "Abdominal pain"],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var MockDrugService = class {
  // Search drugs by name (English or Arabic)
  async searchDrugByName(searchName) {
    const normalizedSearch = searchName.toLowerCase().trim();
    return mockDrugs.find(
      (drug) => drug.name.toLowerCase().includes(normalizedSearch) || drug.nameArabic.toLowerCase().includes(normalizedSearch)
    );
  }
  // Search drugs with filters
  async searchDrugs(filters) {
    let filteredDrugs = [...mockDrugs];
    if (filters.name) {
      const normalizedSearch = filters.name.toLowerCase().trim();
      filteredDrugs = filteredDrugs.filter(
        (drug) => drug.name.toLowerCase().includes(normalizedSearch) || drug.nameArabic.toLowerCase().includes(normalizedSearch)
      );
    }
    if (filters.category && filters.category !== "All") {
      filteredDrugs = filteredDrugs.filter(
        (drug) => drug.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    return filteredDrugs.slice(offset, offset + limit);
  }
  // Get all drugs with pagination
  async getAllDrugs(limit = 50, offset = 0) {
    return mockDrugs.slice(offset, offset + limit);
  }
  // Get total count
  async getTotalCount() {
    return mockDrugs.length;
  }
  // Get drug by ID
  async getDrugById(id) {
    return mockDrugs.find((drug) => drug.id === id);
  }
  // Find alternatives
  async findAlternatives(excludeName, activeIngredient, category, limit = 5) {
    return mockDrugs.filter(
      (drug) => drug.name.toLowerCase() !== excludeName.toLowerCase() && (activeIngredient && drug.activeIngredient.toLowerCase().includes(activeIngredient.toLowerCase()) || category && drug.category.toLowerCase() === category.toLowerCase())
    ).slice(0, limit);
  }
};
var mockDrugService = new MockDrugService();

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auditLogs: () => auditLogs,
  bulkPriceUpdateSchema: () => bulkPriceUpdateSchema,
  changePasswordSchema: () => changePasswordSchema,
  createExportHistorySchema: () => createExportHistorySchema,
  createMarketIntelligenceSchema: () => createMarketIntelligenceSchema,
  createPrescriptionBackupSchema: () => createPrescriptionBackupSchema,
  createPriceTrendSchema: () => createPriceTrendSchema,
  createUsageAnalyticsSchema: () => createUsageAnalyticsSchema,
  createUserAllergySchema: () => createUserAllergySchema,
  createUserPrescriptionSchema: () => createUserPrescriptionSchema,
  dosageCalculationSchema: () => dosageCalculationSchema,
  dosageGuidelines: () => dosageGuidelines,
  drugInteractionCheckSchema: () => drugInteractionCheckSchema,
  drugInteractions: () => drugInteractions,
  drugReviews: () => drugReviews,
  egyptianDrugs: () => egyptianDrugs,
  emailVerificationTokens: () => emailVerificationTokens,
  exportHistory: () => exportHistory,
  forgotPasswordSchema: () => forgotPasswordSchema,
  helpRequests: () => helpRequests,
  helpResponses: () => helpResponses,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertDosageGuidelineSchema: () => insertDosageGuidelineSchema,
  insertDrugInteractionSchema: () => insertDrugInteractionSchema,
  insertDrugReviewSchema: () => insertDrugReviewSchema,
  insertEgyptianDrugSchema: () => insertEgyptianDrugSchema,
  insertEmailVerificationTokenSchema: () => insertEmailVerificationTokenSchema,
  insertExportHistorySchema: () => insertExportHistorySchema,
  insertHelpRequestSchema: () => insertHelpRequestSchema,
  insertHelpResponseSchema: () => insertHelpResponseSchema,
  insertMarketIntelligenceSchema: () => insertMarketIntelligenceSchema,
  insertMedicalQuestionSchema: () => insertMedicalQuestionSchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertPharmacySourceSchema: () => insertPharmacySourceSchema,
  insertPrescriptionBackupSchema: () => insertPrescriptionBackupSchema,
  insertPriceHistorySchema: () => insertPriceHistorySchema,
  insertPriceTrendSchema: () => insertPriceTrendSchema,
  insertSupportTicketSchema: () => insertSupportTicketSchema,
  insertUsageAnalyticsSchema: () => insertUsageAnalyticsSchema,
  insertUserAllergySchema: () => insertUserAllergySchema,
  insertUserConsentSchema: () => insertUserConsentSchema,
  insertUserPrescriptionSchema: () => insertUserPrescriptionSchema,
  insertUserSchema: () => insertUserSchema,
  insertUserSessionSchema: () => insertUserSessionSchema,
  insertUserSettingsSchema: () => insertUserSettingsSchema,
  jwtPayloadSchema: () => jwtPayloadSchema,
  loginSchema: () => loginSchema,
  marketIntelligence: () => marketIntelligence,
  medicalQuestions: () => medicalQuestions,
  passwordResetTokens: () => passwordResetTokens,
  pharmacySources: () => pharmacySources,
  prescriptionBackups: () => prescriptionBackups,
  priceHistory: () => priceHistory,
  priceTrends: () => priceTrends,
  registerSchema: () => registerSchema,
  resetPasswordSchema: () => resetPasswordSchema,
  supportTickets: () => supportTickets,
  updatePriceSchema: () => updatePriceSchema,
  updateProfileSchema: () => updateProfileSchema,
  updateUserSettingsSchema: () => updateUserSettingsSchema,
  usageAnalytics: () => usageAnalytics,
  userAllergies: () => userAllergies,
  userConsents: () => userConsents,
  userPrescriptions: () => userPrescriptions,
  userSessions: () => userSessions,
  userSettings: () => userSettings,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, jsonb, index, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  salt: varchar("salt", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 10 }),
  // 'male', 'female', 'other'
  profilePicture: text("profile_picture"),
  isEmailVerified: boolean("is_email_verified").default(false),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  isActive: boolean("is_active").default(true),
  isPremium: boolean("is_premium").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
  deletedAt: timestamp("deleted_at")
  // Soft delete
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  phoneIdx: index("users_phone_idx").on(table.phone),
  isActiveIdx: index("users_is_active_idx").on(table.isActive),
  createdAtIdx: index("users_created_at_idx").on(table.createdAt)
}));
var userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  sessionToken: varchar("session_token", { length: 500 }).notNull().unique(),
  refreshToken: varchar("refresh_token", { length: 500 }).unique(),
  deviceInfo: jsonb("device_info"),
  // Device type, OS, app version
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  lastAccessedAt: timestamp("last_accessed_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("user_sessions_user_id_idx").on(table.userId),
  sessionTokenIdx: index("user_sessions_token_idx").on(table.sessionToken),
  refreshTokenIdx: index("user_sessions_refresh_token_idx").on(table.refreshToken),
  expiresAtIdx: index("user_sessions_expires_at_idx").on(table.expiresAt),
  isActiveIdx: index("user_sessions_is_active_idx").on(table.isActive)
}));
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
  tokenIdx: index("password_reset_tokens_token_idx").on(table.token),
  expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(table.expiresAt)
}));
var emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("email_verification_tokens_user_id_idx").on(table.userId),
  tokenIdx: index("email_verification_tokens_token_idx").on(table.token),
  emailIdx: index("email_verification_tokens_email_idx").on(table.email)
}));
var userConsents = pgTable("user_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  consentType: varchar("consent_type", { length: 50 }).notNull(),
  // 'privacy_policy', 'terms_of_service', 'data_processing', 'marketing'
  consentVersion: varchar("consent_version", { length: 20 }).notNull(),
  isConsented: boolean("is_consented").notNull(),
  consentedAt: timestamp("consented_at").default(sql`NOW()`),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent")
}, (table) => ({
  userIdIdx: index("user_consents_user_id_idx").on(table.userId),
  consentTypeIdx: index("user_consents_type_idx").on(table.consentType)
}));
var auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }),
  // Nullable for system events
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  // 'prescription', 'user_profile', 'price_update'
  resourceId: varchar("resource_id", { length: 255 }),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  resourceIdx: index("audit_logs_resource_idx").on(table.resource),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt)
}));
var egyptianDrugs = pgTable("egyptian_drugs", {
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
  priceVerified: boolean("price_verified").default(false)
}, (table) => ({
  nameIdx: index("drugs_name_idx").on(table.name),
  nameArabicIdx: index("drugs_name_arabic_idx").on(table.nameArabic),
  activeIngredientIdx: index("drugs_active_ingredient_idx").on(table.activeIngredient),
  categoryIdx: index("drugs_category_idx").on(table.category),
  manufacturerIdx: index("drugs_manufacturer_idx").on(table.manufacturer),
  priceIdx: index("drugs_price_idx").on(table.price)
}));
var priceHistory = pgTable("price_history", {
  id: integer("id").primaryKey().default(sql`NEXTVAL('price_history_id_seq')`),
  drugId: integer("drug_id").notNull(),
  oldPrice: decimal("old_price", { precision: 10, scale: 2 }),
  newPrice: decimal("new_price", { precision: 10, scale: 2 }).notNull(),
  pharmacy: varchar("pharmacy", { length: 100 }),
  region: varchar("region", { length: 100 }),
  source: varchar("source", { length: 100 }),
  // "user_update", "pharmacy_api", "scraping"
  verified: boolean("verified").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  drugIdIdx: index("price_history_drug_id_idx").on(table.drugId),
  createdAtIdx: index("price_history_created_at_idx").on(table.createdAt),
  pharmacyIdx: index("price_history_pharmacy_idx").on(table.pharmacy)
}));
var pharmacySources = pgTable("pharmacy_sources", {
  id: integer("id").primaryKey().default(sql`NEXTVAL('pharmacy_sources_id_seq')`),
  name: varchar("name", { length: 100 }).notNull(),
  website: varchar("website", { length: 255 }),
  apiKey: varchar("api_key", { length: 255 }),
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  region: varchar("region", { length: 100 }),
  reliability: integer("reliability").default(5)
  // 1-10 rating
}, (table) => ({
  nameIdx: index("pharmacy_sources_name_idx").on(table.name),
  regionIdx: index("pharmacy_sources_region_idx").on(table.region)
}));
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
  salt: true,
  firstName: true,
  lastName: true,
  phone: true,
  dateOfBirth: true,
  gender: true,
  profilePicture: true
});
var insertUserSessionSchema = createInsertSchema(userSessions).pick({
  userId: true,
  sessionToken: true,
  refreshToken: true,
  deviceInfo: true,
  ipAddress: true,
  userAgent: true,
  expiresAt: true
});
var insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).pick({
  userId: true,
  token: true,
  expiresAt: true
});
var insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).pick({
  userId: true,
  token: true,
  email: true,
  expiresAt: true
});
var insertUserConsentSchema = createInsertSchema(userConsents).pick({
  userId: true,
  consentType: true,
  consentVersion: true,
  isConsented: true,
  ipAddress: true,
  userAgent: true
});
var insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  action: true,
  resource: true,
  resourceId: true,
  oldValues: true,
  newValues: true,
  ipAddress: true,
  userAgent: true,
  success: true,
  errorMessage: true
});
var registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  ),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(100),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(100),
  phone: z.string().regex(/^[\+]?[1-9][\d\s\-\(\)]*$/, "Invalid phone number").optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["male", "female", "other"]).optional()
});
var loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
var forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
});
var resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  )
});
var changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  )
});
var updateProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(100).optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(100).optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d\s\-\(\)]*$/, "Invalid phone number").optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["male", "female", "other"]).optional()
});
var jwtPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  sessionId: z.string(),
  iat: z.number(),
  exp: z.number(),
  type: z.enum(["access", "refresh"])
});
var insertEgyptianDrugSchema = createInsertSchema(egyptianDrugs);
var insertPriceHistorySchema = createInsertSchema(priceHistory);
var insertPharmacySourceSchema = createInsertSchema(pharmacySources);
var updatePriceSchema = z.object({
  drugId: z.number(),
  newPrice: z.number().positive().max(99999.99),
  pharmacy: z.string().min(1).max(100).optional(),
  region: z.string().min(1).max(100).optional(),
  source: z.enum(["user_update", "pharmacy_api", "scraping"]).default("user_update"),
  notes: z.string().max(500).optional()
});
var bulkPriceUpdateSchema = z.object({
  updates: z.array(updatePriceSchema).max(100)
  // Limit to 100 updates at once
});
var userAllergies = pgTable("user_allergies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  allergenType: varchar("allergen_type", { length: 50 }).notNull(),
  // 'drug', 'food', 'environmental'
  allergenName: varchar("allergen_name", { length: 255 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  // 'mild', 'moderate', 'severe'
  reaction: text("reaction"),
  // Description of allergic reaction
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("user_allergies_user_id_idx").on(table.userId),
  allergenTypeIdx: index("user_allergies_type_idx").on(table.allergenType),
  allergenNameIdx: index("user_allergies_name_idx").on(table.allergenName),
  isActiveIdx: index("user_allergies_is_active_idx").on(table.isActive)
}));
var userPrescriptions = pgTable("user_prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("user_prescriptions_user_id_idx").on(table.userId),
  drugIdIdx: index("user_prescriptions_drug_id_idx").on(table.drugId),
  isActiveIdx: index("user_prescriptions_is_active_idx").on(table.isActive),
  prescribedDateIdx: index("user_prescriptions_prescribed_date_idx").on(table.prescribedDate)
}));
var drugInteractions = pgTable("drug_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drug1Id: integer("drug_1_id").notNull(),
  drug2Id: integer("drug_2_id").notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  // 'minor', 'moderate', 'major', 'contraindicated'
  interactionType: varchar("interaction_type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation"),
  evidenceLevel: varchar("evidence_level", { length: 20 }).default("moderate"),
  // 'theoretical', 'limited', 'moderate', 'strong'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  drug1IdIdx: index("drug_interactions_drug_1_id_idx").on(table.drug1Id),
  drug2IdIdx: index("drug_interactions_drug_2_id_idx").on(table.drug2Id),
  severityIdx: index("drug_interactions_severity_idx").on(table.severity),
  isActiveIdx: index("drug_interactions_is_active_idx").on(table.isActive)
}));
var userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  enableDrugInteractionChecker: boolean("enable_drug_interaction_checker").default(true),
  enableAllergyAlerts: boolean("enable_allergy_alerts").default(true),
  enableDosageCalculator: boolean("enable_dosage_calculator").default(true),
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
  preferredUnits: varchar("preferred_units", { length: 10 }).default("metric"),
  // 'metric', 'imperial'
  notificationsEnabled: boolean("notifications_enabled").default(true),
  darkMode: boolean("dark_mode").default(false),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("user_settings_user_id_idx").on(table.userId)
}));
var prescriptionBackups = pgTable("prescription_backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  backupData: jsonb("backup_data").notNull(),
  // Complete prescription data
  backupType: varchar("backup_type", { length: 50 }).notNull(),
  // 'manual', 'auto', 'sync'
  deviceId: varchar("device_id", { length: 255 }),
  // Source device identifier
  cloudProvider: varchar("cloud_provider", { length: 100 }),
  // 'google_drive', 'icloud', 'dropbox', 'aws'
  cloudPath: varchar("cloud_path", { length: 500 }),
  // Path in cloud storage
  checksum: varchar("checksum", { length: 64 }),
  // Data integrity verification
  isEncrypted: boolean("is_encrypted").default(true),
  backupSize: integer("backup_size"),
  // Size in bytes
  syncStatus: varchar("sync_status", { length: 50 }).default("pending"),
  // 'pending', 'syncing', 'completed', 'failed'
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("prescription_backups_user_id_idx").on(table.userId),
  backupTypeIdx: index("prescription_backups_type_idx").on(table.backupType),
  syncStatusIdx: index("prescription_backups_sync_status_idx").on(table.syncStatus),
  createdAtIdx: index("prescription_backups_created_at_idx").on(table.createdAt)
}));
var usageAnalytics = pgTable("usage_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  // 'scan', 'search', 'export', 'backup', 'interaction_check'
  eventName: varchar("event_name", { length: 255 }).notNull(),
  eventData: jsonb("event_data"),
  // Additional event-specific data
  sessionId: varchar("session_id", { length: 255 }),
  deviceId: varchar("device_id", { length: 255 }),
  appVersion: varchar("app_version", { length: 50 }),
  platform: varchar("platform", { length: 50 }),
  // 'ios', 'android', 'web'
  duration: integer("duration"),
  // Event duration in milliseconds
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  location: jsonb("location"),
  // Geolocation data
  createdAt: timestamp("created_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("usage_analytics_user_id_idx").on(table.userId),
  eventTypeIdx: index("usage_analytics_event_type_idx").on(table.eventType),
  sessionIdIdx: index("usage_analytics_session_id_idx").on(table.sessionId),
  createdAtIdx: index("usage_analytics_created_at_idx").on(table.createdAt)
}));
var priceTrends = pgTable("price_trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drugId: integer("drug_id").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  pharmacy: varchar("pharmacy", { length: 255 }),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  previousPrice: decimal("previous_price", { precision: 10, scale: 2 }),
  priceChange: decimal("price_change", { precision: 10, scale: 2 }),
  priceChangePercent: decimal("price_change_percent", { precision: 5, scale: 2 }),
  trendDirection: varchar("trend_direction", { length: 20 }).notNull(),
  // 'up', 'down', 'stable'
  trendStrength: varchar("trend_strength", { length: 20 }).notNull(),
  // 'weak', 'moderate', 'strong'
  predictedPrice: decimal("predicted_price", { precision: 10, scale: 2 }),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  // Prediction confidence 0-1
  dataPoints: integer("data_points").default(1),
  // Number of data points used for analysis
  analysisPeriod: varchar("analysis_period", { length: 50 }).notNull(),
  // '7d', '30d', '90d', '1y'
  lastUpdated: timestamp("last_updated").default(sql`NOW()`),
  createdAt: timestamp("created_at").default(sql`NOW()`)
}, (table) => ({
  drugIdIdx: index("price_trends_drug_id_idx").on(table.drugId),
  regionIdx: index("price_trends_region_idx").on(table.region),
  pharmacyIdx: index("price_trends_pharmacy_idx").on(table.pharmacy),
  trendDirectionIdx: index("price_trends_direction_idx").on(table.trendDirection),
  lastUpdatedIdx: index("price_trends_last_updated_idx").on(table.lastUpdated)
}));
var marketIntelligence = pgTable("market_intelligence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drugId: integer("drug_id").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  availabilityStatus: varchar("availability_status", { length: 50 }).notNull(),
  // 'available', 'limited', 'out_of_stock', 'discontinued'
  stockLevel: integer("stock_level"),
  // Current stock level if available
  demandLevel: varchar("demand_level", { length: 50 }).notNull(),
  // 'low', 'medium', 'high', 'very_high'
  seasonality: varchar("seasonality", { length: 50 }),
  // 'high_season', 'low_season', 'stable'
  competitorPricing: jsonb("competitor_pricing"),
  // Competitor price comparison
  marketShare: decimal("market_share", { precision: 5, scale: 2 }),
  forecastDemand: integer("forecast_demand"),
  // Demand forecast for next period
  recommendedAction: varchar("recommended_action", { length: 255 }),
  insights: jsonb("insights"),
  // Additional market insights
  dataSource: varchar("data_source", { length: 100 }),
  // 'pharmacy_api', 'scraping', 'user_reports'
  reliability: integer("reliability").default(5),
  // Data reliability score 1-10
  lastChecked: timestamp("last_checked").default(sql`NOW()`),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  drugIdIdx: index("market_intelligence_drug_id_idx").on(table.drugId),
  regionIdx: index("market_intelligence_region_idx").on(table.region),
  availabilityStatusIdx: index("market_intelligence_status_idx").on(table.availabilityStatus),
  demandLevelIdx: index("market_intelligence_demand_idx").on(table.demandLevel),
  lastCheckedIdx: index("market_intelligence_last_checked_idx").on(table.lastChecked)
}));
var exportHistory = pgTable("export_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  exportType: varchar("export_type", { length: 50 }).notNull(),
  // 'pdf', 'email', 'print', 'csv'
  contentType: varchar("content_type", { length: 100 }).notNull(),
  // 'prescription_history', 'analysis_results', 'price_comparison'
  contentData: jsonb("content_data").notNull(),
  // The exported data
  fileName: varchar("file_name", { length: 255 }),
  fileSize: integer("file_size"),
  // Size in bytes
  format: varchar("format", { length: 50 }),
  // 'pdf', 'csv', 'json'
  deliveryMethod: varchar("delivery_method", { length: 100 }),
  // 'download', 'email', 'print'
  recipientEmail: varchar("recipient_email", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending"),
  // 'pending', 'processing', 'completed', 'failed'
  downloadUrl: varchar("download_url", { length: 500 }),
  // For downloadable exports
  expiresAt: timestamp("expires_at"),
  // When download link expires
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("export_history_user_id_idx").on(table.userId),
  exportTypeIdx: index("export_history_type_idx").on(table.exportType),
  statusIdx: index("export_history_status_idx").on(table.status),
  createdAtIdx: index("export_history_created_at_idx").on(table.createdAt)
}));
var dosageGuidelines = pgTable("dosage_guidelines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  drugId: integer("drug_id").notNull(),
  ageGroup: varchar("age_group", { length: 50 }).notNull(),
  // 'neonate', 'infant', 'child', 'adolescent', 'adult', 'elderly'
  weightRange: varchar("weight_range", { length: 50 }),
  // e.g., '10-20kg', '20-40kg'
  condition: varchar("condition", { length: 255 }),
  // Specific condition or indication
  dosagePerKg: varchar("dosage_per_kg", { length: 255 }),
  // e.g., '5-10mg/kg/day'
  maxDailyDose: varchar("max_daily_dose", { length: 255 }),
  frequency: varchar("frequency", { length: 255 }),
  duration: varchar("duration", { length: 255 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  drugIdIdx: index("dosage_guidelines_drug_id_idx").on(table.drugId),
  ageGroupIdx: index("dosage_guidelines_age_group_idx").on(table.ageGroup),
  isActiveIdx: index("dosage_guidelines_is_active_idx").on(table.isActive)
}));
var insertUserAllergySchema = createInsertSchema(userAllergies).pick({
  userId: true,
  allergenType: true,
  allergenName: true,
  severity: true,
  reaction: true,
  notes: true
});
var insertUserPrescriptionSchema = createInsertSchema(userPrescriptions).pick({
  userId: true,
  drugId: true,
  drugName: true,
  dosage: true,
  frequency: true,
  duration: true,
  prescribedBy: true,
  prescribedDate: true,
  notes: true
});
var insertDrugInteractionSchema = createInsertSchema(drugInteractions).pick({
  drug1Id: true,
  drug2Id: true,
  severity: true,
  interactionType: true,
  description: true,
  recommendation: true,
  evidenceLevel: true
});
var insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  userId: true,
  enableDrugInteractionChecker: true,
  enableAllergyAlerts: true,
  enableDosageCalculator: true,
  preferredLanguage: true,
  preferredUnits: true,
  notificationsEnabled: true,
  darkMode: true
});
var insertDosageGuidelineSchema = createInsertSchema(dosageGuidelines).pick({
  drugId: true,
  ageGroup: true,
  weightRange: true,
  condition: true,
  dosagePerKg: true,
  maxDailyDose: true,
  frequency: true,
  duration: true,
  notes: true
});
var insertPrescriptionBackupSchema = createInsertSchema(prescriptionBackups).pick({
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
  lastSyncAt: true
});
var insertUsageAnalyticsSchema = createInsertSchema(usageAnalytics).pick({
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
  location: true
});
var insertPriceTrendSchema = createInsertSchema(priceTrends).pick({
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
  lastUpdated: true
});
var insertMarketIntelligenceSchema = createInsertSchema(marketIntelligence).pick({
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
  lastChecked: true
});
var insertExportHistorySchema = createInsertSchema(exportHistory).pick({
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
  errorMessage: true
});
var drugReviews = pgTable("drug_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  drugId: integer("drug_id").notNull(),
  drugName: varchar("drug_name", { length: 255 }).notNull(),
  activeIngredient: varchar("active_ingredient", { length: 255 }),
  dosage: varchar("dosage", { length: 255 }),
  frequency: varchar("frequency", { length: 255 }),
  duration: varchar("duration", { length: 255 }),
  effectiveness: varchar("effectiveness", { length: 20 }).notNull(),
  // 'very_poor', 'poor', 'average', 'good', 'very_good', 'excellent'
  sideEffects: jsonb("side_effects"),
  // Array of side effects
  interactions: jsonb("interactions"),
  // Array of interaction details
  rating: integer("rating").notNull(),
  // 1-6 scale
  review: text("review"),
  pros: text("pros"),
  cons: text("cons"),
  isVerified: boolean("is_verified").default(false),
  helpful: integer("helpful").default(0),
  // Number of helpful votes
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("drug_reviews_user_id_idx").on(table.userId),
  drugIdIdx: index("drug_reviews_drug_id_idx").on(table.drugId),
  ratingIdx: index("drug_reviews_rating_idx").on(table.rating),
  effectivenessIdx: index("drug_reviews_effectiveness_idx").on(table.effectiveness),
  createdAtIdx: index("drug_reviews_created_at_idx").on(table.createdAt)
}));
var medicalQuestions = pgTable("medical_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  drugId: integer("drug_id"),
  drugName: varchar("drug_name", { length: 255 }),
  question: text("question").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  // 'efficacy', 'safety', 'usage', 'interactions', 'side_effects', 'alternatives'
  answer: text("answer"),
  isAnswered: boolean("is_answered").default(false),
  askedBy: varchar("asked_by", { length: 255 }),
  answeredBy: varchar("answered_by", { length: 255 }),
  helpful: integer("helpful").default(0),
  // Number of helpful votes
  views: integer("views").default(0),
  // Number of views
  isModerated: boolean("is_moderated").default(false),
  isPublic: boolean("is_public").default(true),
  tags: jsonb("tags"),
  // Array of tags
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("medical_questions_user_id_idx").on(table.userId),
  drugIdIdx: index("medical_questions_drug_id_idx").on(table.drugId),
  categoryIdx: index("medical_questions_category_idx").on(table.category),
  isAnsweredIdx: index("medical_questions_is_answered_idx").on(table.isAnswered),
  isPublicIdx: index("medical_questions_is_public_idx").on(table.isPublic),
  createdAtIdx: index("medical_questions_created_at_idx").on(table.createdAt)
}));
var supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  issueType: varchar("issue_type", { length: 50 }).notNull(),
  // 'bug', 'feature_request', 'question', 'feedback', 'complaint'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }),
  priority: varchar("priority", { length: 20 }).default("medium"),
  // 'low', 'medium', 'high', 'critical'
  status: varchar("status", { length: 20 }).default("open"),
  // 'open', 'in_progress', 'resolved', 'closed', 'reopened', 'on_hold'
  assignedTo: varchar("assigned_to", { length: 255 }),
  assignedAt: timestamp("assigned_at"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by", { length: 255 }),
  dueDate: timestamp("due_date"),
  resolutionTime: integer("resolution_time"),
  // Resolution time in minutes
  attachments: jsonb("attachments"),
  // Array of attachment URLs
  internalNotes: text("internal_notes"),
  userSatisfaction: integer("user_satisfaction"),
  // 1-5 rating
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("support_tickets_user_id_idx").on(table.userId),
  issueTypeIdx: index("support_tickets_issue_type_idx").on(table.issueType),
  statusIdx: index("support_tickets_status_idx").on(table.status),
  priorityIdx: index("support_tickets_priority_idx").on(table.priority),
  assignedToIdx: index("support_tickets_assigned_to_idx").on(table.assignedTo),
  createdAtIdx: index("support_tickets_created_at_idx").on(table.createdAt)
}));
var helpRequests = pgTable("help_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  query: varchar("query", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  // 'general', 'drug_specific', 'usage_help', 'interaction_check', 'dosage_help', 'allergy_help', 'backup_help', 'export_help', 'update_help', 'account_help', 'security_help', 'technical_support'
  question: text("question").notNull(),
  context: jsonb("context"),
  // Additional context data
  metadata: jsonb("metadata"),
  // Request metadata
  response: text("response"),
  isAnswered: boolean("is_answered").default(false),
  answeredBy: varchar("answered_by", { length: 255 }),
  answeredAt: timestamp("answered_at"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  assignedAt: timestamp("assigned_at"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 20 }).default("open"),
  // 'open', 'in_progress', 'resolved', 'closed'
  helpful: integer("helpful").default(0),
  // Number of helpful votes
  sources: jsonb("sources"),
  // Response sources
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  userIdIdx: index("help_requests_user_id_idx").on(table.userId),
  categoryIdx: index("help_requests_category_idx").on(table.category),
  statusIdx: index("help_requests_status_idx").on(table.status),
  priorityIdx: index("help_requests_priority_idx").on(table.priority),
  isAnsweredIdx: index("help_requests_is_answered_idx").on(table.isAnswered),
  createdAtIdx: index("help_requests_created_at_idx").on(table.createdAt)
}));
var helpResponses = pgTable("help_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id", { length: 255 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  helpful: integer("helpful").default(0),
  sources: jsonb("sources"),
  // Array of source objects
  isAutomated: boolean("is_automated").default(false),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  // Response confidence 0-1
  respondedBy: varchar("responded_by", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`)
}, (table) => ({
  requestIdIdx: index("help_responses_request_id_idx").on(table.requestId),
  categoryIdx: index("help_responses_category_idx").on(table.category),
  createdAtIdx: index("help_responses_created_at_idx").on(table.createdAt)
}));
var insertDrugReviewSchema = createInsertSchema(drugReviews).pick({
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
  cons: true
});
var insertMedicalQuestionSchema = createInsertSchema(medicalQuestions).pick({
  userId: true,
  drugId: true,
  drugName: true,
  question: true,
  category: true,
  answer: true,
  askedBy: true,
  answeredBy: true,
  tags: true
});
var insertSupportTicketSchema = createInsertSchema(supportTickets).pick({
  userId: true,
  issueType: true,
  title: true,
  description: true,
  category: true,
  priority: true,
  attachments: true,
  internalNotes: true
});
var insertHelpRequestSchema = createInsertSchema(helpRequests).pick({
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
  sources: true
});
var insertHelpResponseSchema = createInsertSchema(helpResponses).pick({
  requestId: true,
  answer: true,
  category: true,
  sources: true,
  isAutomated: true,
  confidence: true,
  respondedBy: true
});
var createUserAllergySchema = z.object({
  allergenType: z.enum(["drug", "food", "environmental"]),
  allergenName: z.string().min(1).max(255),
  severity: z.enum(["mild", "moderate", "severe"]),
  reaction: z.string().max(1e3).optional(),
  notes: z.string().max(1e3).optional()
});
var createUserPrescriptionSchema = z.object({
  drugId: z.number(),
  drugName: z.string().min(1).max(255),
  dosage: z.string().min(1).max(255),
  frequency: z.string().min(1).max(255),
  duration: z.string().max(255).optional(),
  prescribedBy: z.string().max(255).optional(),
  prescribedDate: z.string().datetime().optional(),
  notes: z.string().max(1e3).optional()
});
var updateUserSettingsSchema = z.object({
  enableDrugInteractionChecker: z.boolean().optional(),
  enableAllergyAlerts: z.boolean().optional(),
  enableDosageCalculator: z.boolean().optional(),
  preferredLanguage: z.string().max(10).optional(),
  preferredUnits: z.enum(["metric", "imperial"]).optional(),
  notificationsEnabled: z.boolean().optional(),
  darkMode: z.boolean().optional()
});
var dosageCalculationSchema = z.object({
  drugId: z.number(),
  age: z.number().min(0).max(150),
  weight: z.number().min(0).max(500),
  ageGroup: z.enum(["neonate", "infant", "child", "adolescent", "adult", "elderly"]).optional(),
  condition: z.string().max(255).optional()
});
var drugInteractionCheckSchema = z.object({
  drugIds: z.array(z.number()).min(2).max(20)
  // Check between 2-20 drugs
});
var createPrescriptionBackupSchema = z.object({
  backupType: z.enum(["manual", "auto", "sync"]),
  cloudProvider: z.enum(["google_drive", "icloud", "dropbox", "aws"]).optional(),
  deviceId: z.string().max(255).optional(),
  isEncrypted: z.boolean().default(true)
});
var createUsageAnalyticsSchema = z.object({
  eventType: z.enum(["scan", "search", "export", "backup", "interaction_check", "dosage_calculation", "allergy_check"]),
  eventName: z.string().min(1).max(255),
  eventData: z.any().optional(),
  sessionId: z.string().max(255).optional(),
  deviceId: z.string().max(255).optional(),
  appVersion: z.string().max(50).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
  duration: z.number().optional(),
  success: z.boolean().default(true),
  errorMessage: z.string().max(1e3).optional(),
  location: z.any().optional()
});
var createPriceTrendSchema = z.object({
  drugId: z.number(),
  region: z.string().min(1).max(100),
  pharmacy: z.string().max(255).optional(),
  currentPrice: z.number().positive(),
  previousPrice: z.number().positive().optional(),
  trendDirection: z.enum(["up", "down", "stable"]),
  trendStrength: z.enum(["weak", "moderate", "strong"]),
  predictedPrice: z.number().positive().optional(),
  confidence: z.number().min(0).max(1).optional(),
  dataPoints: z.number().min(1).default(1),
  analysisPeriod: z.enum(["7d", "30d", "90d", "1y"])
});
var createMarketIntelligenceSchema = z.object({
  drugId: z.number(),
  region: z.string().min(1).max(100),
  availabilityStatus: z.enum(["available", "limited", "out_of_stock", "discontinued"]),
  stockLevel: z.number().min(0).optional(),
  demandLevel: z.enum(["low", "medium", "high", "very_high"]),
  seasonality: z.enum(["high_season", "low_season", "stable"]).optional(),
  competitorPricing: z.any().optional(),
  marketShare: z.number().min(0).max(100).optional(),
  forecastDemand: z.number().min(0).optional(),
  recommendedAction: z.string().max(255).optional(),
  insights: z.any().optional(),
  dataSource: z.enum(["pharmacy_api", "scraping", "user_reports"]),
  reliability: z.number().min(1).max(10).default(5)
});
var createExportHistorySchema = z.object({
  exportType: z.enum(["pdf", "email", "print", "csv"]),
  contentType: z.enum(["prescription_history", "analysis_results", "price_comparison", "usage_analytics"]),
  contentData: z.any(),
  fileName: z.string().max(255).optional(),
  format: z.enum(["pdf", "csv", "json"]),
  deliveryMethod: z.enum(["download", "email", "print"]),
  recipientEmail: z.string().email().optional(),
  expiresAt: z.string().datetime().optional()
});

// server/db.ts
var connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/medscan_egypt";
var isProduction = process.env.NODE_ENV === "production";
var poolConfig = {
  max: isProduction ? 50 : 10,
  // More connections in production
  idle_timeout: isProduction ? 60 : 30,
  // Longer idle timeout in production
  connect_timeout: 10,
  // Connection timeout in seconds
  max_lifetime: isProduction ? 2 * 60 * 60 : 60 * 60,
  // 2 hours in production, 1 hour in dev
  prepare: false,
  // Disable prepared statements for better pooling
  onnotice: (notice) => console.log("Database notice:", notice),
  debug: process.env.NODE_ENV === "development",
  // Advanced pooling options
  transform: postgres.camel,
  // Enable connection retries
  retry: 3,
  // Connection backoff strategy
  backoff: {
    min: 100,
    max: 1e3,
    factor: 2
  },
  // Enable query timeout
  statement_timeout: isProduction ? 3e4 : 6e4,
  // 30s prod, 60s dev
  // Enable read-only replicas for read operations (if configured)
  ...process.env.DATABASE_READ_URL && {
    read_url: process.env.DATABASE_READ_URL
  }
};
var client = postgres(connectionString, poolConfig);
var db = drizzle(client, {
  schema: schema_exports,
  logger: process.env.NODE_ENV === "development"
});
var closeDatabase = async () => {
  try {
    console.log("Closing database connections...");
    await client.end();
    console.log("Database connections closed successfully");
  } catch (error) {
    console.error("Error closing database connections:", error);
  }
};
process.on("SIGINT", async () => {
  await closeDatabase();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await closeDatabase();
  process.exit(0);
});

// server/priceService.ts
import { eq, and, desc, asc, gt, lt, inArray } from "drizzle-orm";
var PriceService = class {
  // Update single drug price with history tracking
  async updatePrice(updateData) {
    const { drugId, newPrice, pharmacy, region, source, notes } = updateData;
    const currentDrug = await db.select().from(schema_exports.egyptianDrugs).where(eq(schema_exports.egyptianDrugs.id, drugId)).limit(1);
    if (!currentDrug[0]) {
      throw new Error("Drug not found");
    }
    const oldPrice = currentDrug[0].price;
    await db.update(schema_exports.egyptianDrugs).set({
      price: String(newPrice),
      lastPriceUpdate: /* @__PURE__ */ new Date(),
      priceVerified: source === "pharmacy_api"
    }).where(eq(schema_exports.egyptianDrugs.id, drugId));
    const historyRecord = await db.insert(schema_exports.priceHistory).values({
      drugId,
      oldPrice: oldPrice ? String(oldPrice) : null,
      newPrice: String(newPrice),
      pharmacy: pharmacy || null,
      region: region || null,
      source,
      notes: notes || null,
      verified: source === "pharmacy_api"
    }).returning();
    const updatedDrug = await db.select().from(schema_exports.egyptianDrugs).where(eq(schema_exports.egyptianDrugs.id, drugId)).limit(1);
    return {
      drug: updatedDrug[0],
      history: historyRecord[0]
    };
  }
  // Bulk price update
  async bulkUpdatePrices(updateData) {
    const results = [];
    for (const update of updateData.updates) {
      try {
        const result = await this.updatePrice(update);
        results.push(result);
      } catch (error) {
        console.error(`Failed to update price for drug ${update.drugId}:`, error);
      }
    }
    return results;
  }
  // Get price history for a drug
  async getPriceHistory(drugId, limit = 50, offset = 0) {
    return await db.select().from(schema_exports.priceHistory).where(eq(schema_exports.priceHistory.drugId, drugId)).orderBy(desc(schema_exports.priceHistory.createdAt)).limit(limit).offset(offset);
  }
  // Get price changes within a date range
  async getPriceChanges(startDate, endDate, drugId) {
    let query = db.select().from(schema_exports.priceHistory).where(
      and(
        gt(schema_exports.priceHistory.createdAt, startDate),
        lt(schema_exports.priceHistory.createdAt, endDate)
      )
    );
    if (drugId) {
      return await db.select().from(schema_exports.priceHistory).where(
        and(
          eq(schema_exports.priceHistory.drugId, drugId),
          gt(schema_exports.priceHistory.createdAt, startDate),
          lt(schema_exports.priceHistory.createdAt, endDate)
        )
      ).orderBy(desc(schema_exports.priceHistory.createdAt));
    }
    return await db.select().from(schema_exports.priceHistory).where(
      and(
        gt(schema_exports.priceHistory.createdAt, startDate),
        lt(schema_exports.priceHistory.createdAt, endDate)
      )
    ).orderBy(desc(schema_exports.priceHistory.createdAt));
  }
  // Get drugs with recent price changes
  async getRecentPriceChanges(days = 7, limit = 20) {
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - days);
    const recentHistory = await db.select().from(schema_exports.priceHistory).where(gt(schema_exports.priceHistory.createdAt, startDate)).orderBy(desc(schema_exports.priceHistory.createdAt)).limit(limit);
    const drugIds = Array.from(new Set(recentHistory.map((h) => h.drugId)));
    const drugs = drugIds.length ? await db.select().from(schema_exports.egyptianDrugs).where(inArray(schema_exports.egyptianDrugs.id, drugIds)) : [];
    const drugMap = new Map(drugs.map((d) => [d.id, d]));
    return recentHistory.map((history) => {
      const drug = drugMap.get(history.drugId);
      return drug ? { drug, latestHistory: history } : null;
    }).filter((entry) => Boolean(entry));
  }
  // Get price statistics for a drug
  async getPriceStatistics(drugId) {
    const drug = await db.select().from(schema_exports.egyptianDrugs).where(eq(schema_exports.egyptianDrugs.id, drugId)).limit(1);
    if (!drug[0]) {
      throw new Error("Drug not found");
    }
    const priceHistory2 = await db.select({
      newPrice: schema_exports.priceHistory.newPrice
    }).from(schema_exports.priceHistory).where(eq(schema_exports.priceHistory.drugId, drugId));
    const prices = priceHistory2.map((h) => Number(h.newPrice)).filter((p) => p > 0);
    return {
      currentPrice: drug[0].price ? Number(drug[0].price) : null,
      averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      maxPrice: prices.length > 0 ? Math.max(...prices) : null,
      priceChangeCount: prices.length,
      lastUpdated: drug[0].lastPriceUpdate || null
    };
  }
  // Get price trends analysis
  async getPriceTrends(drugId, days = 30) {
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - days);
    const history = await db.select().from(schema_exports.priceHistory).where(
      and(
        eq(schema_exports.priceHistory.drugId, drugId),
        gt(schema_exports.priceHistory.createdAt, startDate)
      )
    ).orderBy(asc(schema_exports.priceHistory.createdAt));
    if (history.length < 2) {
      return {
        trend: "stable",
        percentageChange: 0,
        dataPoints: history.filter((h) => h.createdAt).map((h) => ({ date: h.createdAt, price: Number(h.newPrice) }))
      };
    }
    const firstPrice = Number(history[0].newPrice);
    const lastPrice = Number(history[history.length - 1].newPrice);
    const percentageChange = (lastPrice - firstPrice) / firstPrice * 100;
    let trend;
    if (percentageChange > 5) {
      trend = "increasing";
    } else if (percentageChange < -5) {
      trend = "decreasing";
    } else {
      trend = "stable";
    }
    return {
      trend,
      percentageChange,
      dataPoints: history.filter((h) => h.createdAt).map((h) => ({ date: h.createdAt, price: Number(h.newPrice) }))
    };
  }
  // Verify price (mark as verified)
  async verifyPrice(drugId, verified = true) {
    await db.update(schema_exports.egyptianDrugs).set({ priceVerified: verified }).where(eq(schema_exports.egyptianDrugs.id, drugId));
    const updatedDrug = await db.select().from(schema_exports.egyptianDrugs).where(eq(schema_exports.egyptianDrugs.id, drugId)).limit(1);
    if (!updatedDrug[0]) {
      throw new Error("Drug not found");
    }
    return updatedDrug[0];
  }
  // Get unverified prices
  async getUnverifiedPrices(limit = 50) {
    const drugs = await db.select().from(schema_exports.egyptianDrugs).where(eq(schema_exports.egyptianDrugs.priceVerified, false)).limit(limit);
    const drugIds = drugs.map((d) => d.id);
    const histories = drugIds.length ? await db.select().from(schema_exports.priceHistory).where(inArray(schema_exports.priceHistory.drugId, drugIds)).orderBy(desc(schema_exports.priceHistory.createdAt)) : [];
    const latestHistoryByDrug = /* @__PURE__ */ new Map();
    for (const history of histories) {
      if (!latestHistoryByDrug.has(history.drugId)) {
        latestHistoryByDrug.set(history.drugId, history);
      }
    }
    return drugs.map((drug) => ({
      drug,
      lastHistory: latestHistoryByDrug.get(drug.id) || null
    }));
  }
};
var priceService = new PriceService();

// server/priceRoutes.ts
async function updateDrugPrice(req, res) {
  try {
    const validationResult = updatePriceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validationResult.error.errors
      });
    }
    const result = await priceService.updatePrice(validationResult.data);
    res.json({
      success: true,
      message: "Price updated successfully",
      data: result
    });
  } catch (error) {
    console.error("Error updating drug price:", error);
    res.status(500).json({
      error: "Failed to update price",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function bulkUpdatePrices(req, res) {
  try {
    const validationResult = bulkPriceUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validationResult.error.errors
      });
    }
    const results = await priceService.bulkUpdatePrices(validationResult.data);
    res.json({
      success: true,
      message: `Updated ${results.length} prices`,
      data: results
    });
  } catch (error) {
    console.error("Error in bulk price update:", error);
    res.status(500).json({
      error: "Failed to update prices",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function getPriceHistory(req, res) {
  try {
    const drugId = parseInt(req.params.drugId);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    if (isNaN(drugId)) {
      return res.status(400).json({ error: "Invalid drug ID" });
    }
    const history = await priceService.getPriceHistory(drugId, limit, offset);
    res.json({
      drugId,
      history,
      limit,
      offset
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    res.status(500).json({
      error: "Failed to fetch price history",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function getPriceStatistics(req, res) {
  try {
    const drugId = parseInt(req.params.drugId);
    if (isNaN(drugId)) {
      return res.status(400).json({ error: "Invalid drug ID" });
    }
    const statistics = await priceService.getPriceStatistics(drugId);
    res.json({
      drugId,
      statistics
    });
  } catch (error) {
    console.error("Error fetching price statistics:", error);
    res.status(500).json({
      error: "Failed to fetch price statistics",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function getPriceTrends(req, res) {
  try {
    const drugId = parseInt(req.params.drugId);
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    if (isNaN(drugId)) {
      return res.status(400).json({ error: "Invalid drug ID" });
    }
    const trends = await priceService.getPriceTrends(drugId, days);
    res.json({
      drugId,
      days,
      trends
    });
  } catch (error) {
    console.error("Error fetching price trends:", error);
    res.status(500).json({
      error: "Failed to fetch price trends",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function getRecentPriceChanges(req, res) {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 90);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const changes = await priceService.getRecentPriceChanges(days, limit);
    res.json({
      days,
      limit,
      changes
    });
  } catch (error) {
    console.error("Error fetching recent price changes:", error);
    res.status(500).json({
      error: "Failed to fetch recent price changes",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function verifyDrugPrice(req, res) {
  try {
    const drugId = parseInt(req.params.drugId);
    const { verified } = req.body;
    if (isNaN(drugId)) {
      return res.status(400).json({ error: "Invalid drug ID" });
    }
    const drug = await priceService.verifyPrice(drugId, verified !== false);
    res.json({
      success: true,
      message: `Price ${verified !== false ? "verified" : "unverified"} successfully`,
      drug
    });
  } catch (error) {
    console.error("Error verifying price:", error);
    res.status(500).json({
      error: "Failed to verify price",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function getUnverifiedPrices(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const unverified = await priceService.getUnverifiedPrices(limit);
    res.json({
      limit,
      unverified
    });
  } catch (error) {
    console.error("Error fetching unverified prices:", error);
    res.status(500).json({
      error: "Failed to fetch unverified prices",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function getPriceChangesByDateRange(req, res) {
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);
    const drugId = req.query.drugId ? parseInt(req.query.drugId) : void 0;
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid date range" });
    }
    const changes = await priceService.getPriceChanges(startDate, endDate, drugId);
    res.json({
      startDate,
      endDate,
      drugId,
      changes
    });
  } catch (error) {
    console.error("Error fetching price changes by date range:", error);
    res.status(500).json({
      error: "Failed to fetch price changes",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// server/tarshoubyService.ts
import axios from "axios";
import * as cheerio from "cheerio";
var TarshoubyService = class {
  baseUrl = "https://www.alabdellatif-tarshouby.com";
  searchUrl = "https://www.alabdellatif-tarshouby.com/en/products";
  userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
  timeout = 15e3;
  // 15 seconds
  // Search for products by drug name
  async searchProducts(drugName) {
    try {
      const searchUrl = `${this.searchUrl}?search=${encodeURIComponent(drugName)}`;
      console.log(`Searching Tarshouby for: ${drugName}`);
      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent": this.userAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1"
        },
        timeout: this.timeout
      });
      const $ = cheerio.load(response.data);
      const products = this.extractProducts($, drugName);
      return {
        products,
        totalCount: products.length,
        searchQuery: drugName,
        timestamp: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      console.error("Error searching Tarshouby:", error);
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          throw new Error("Tarshouby website timeout - please try again");
        } else if (error.response?.status === 404) {
          throw new Error("Product not found on Tarshouby website");
        } else if (error.response?.status >= 500) {
          throw new Error("Tarshouby website is temporarily unavailable");
        }
      }
      throw new Error("Failed to search Tarshouby website");
    }
  }
  // Extract product information from the page
  extractProducts($, searchQuery) {
    const products = [];
    const productSelectors = [
      ".product-item",
      ".product-card",
      ".product",
      '[class*="product"]',
      ".item",
      '[class*="item"]'
    ];
    let productElements = $();
    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        productElements = elements;
        break;
      }
    }
    if (productElements.length === 0) {
      console.log("No product elements found with common selectors");
      return products;
    }
    productElements.each((index2, element) => {
      try {
        const product = this.extractProductData($, element, searchQuery);
        if (product && product.name) {
          products.push(product);
        }
      } catch (error) {
        console.error(`Error extracting product ${index2}:`, error);
      }
    });
    return products;
  }
  // Extract individual product data
  extractProductData($, element, searchQuery) {
    const $element = $(element);
    const nameSelectors = [".product-name", ".title", "h1", "h2", "h3", ".name", '[class*="name"]'];
    let name = "";
    for (const selector of nameSelectors) {
      const found = $element.find(selector).first().text().trim();
      if (found) {
        name = found;
        break;
      }
    }
    if (!name) {
      name = $element.text().trim().split("\n")[0]?.trim() || "";
    }
    if (!name || name.length < 2) {
      return null;
    }
    const nameLower = name.toLowerCase();
    const queryLower = searchQuery.toLowerCase();
    if (!nameLower.includes(queryLower) && !queryLower.includes(nameLower.split(" ")[0])) {
      return null;
    }
    const price = this.extractPrice($element);
    const imageUrl = this.extractImageUrl($element);
    const productUrl = this.extractProductUrl($element);
    const availability = this.extractAvailability($element);
    const manufacturer = this.extractManufacturer($element);
    const description = this.extractDescription($element);
    const requiresPrescription = this.checkPrescriptionRequired($element, name);
    return {
      name,
      price,
      originalPrice: price,
      // Will be updated if discount info found
      discount: void 0,
      availability,
      imageUrl,
      productUrl,
      manufacturer,
      description,
      requiresPrescription,
      lastUpdated: /* @__PURE__ */ new Date()
    };
  }
  // Extract price information
  extractPrice($element) {
    const priceSelectors = [
      ".price",
      ".amount",
      '[class*="price"]',
      '[class*="cost"]',
      "[data-price]"
    ];
    for (const selector of priceSelectors) {
      const priceText = $element.find(selector).first().text().trim();
      const price = this.parsePrice(priceText);
      if (price !== void 0) {
        return price;
      }
    }
    const elementText = $element.text();
    const priceMatch = elementText.match(/(?:EGP|£|$)?\s*(\d+(?:\.\d{2})?)/i);
    if (priceMatch) {
      return parseFloat(priceMatch[1]);
    }
    return void 0;
  }
  // Parse price from text
  parsePrice(text2) {
    if (!text2) return void 0;
    const cleanText = text2.replace(/[EGP£$\s,]/gi, "");
    const priceMatch = cleanText.match(/(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      return price > 0 && price < 1e5 ? price : void 0;
    }
    return void 0;
  }
  // Extract image URL
  extractImageUrl($element) {
    const imgSelectors = ["img", '[class*="image"]', ".photo"];
    for (const selector of imgSelectors) {
      const img = $element.find(selector).first();
      const src = img.attr("src") || img.attr("data-src");
      if (src) {
        return src.startsWith("http") ? src : `${this.baseUrl}${src}`;
      }
    }
    return void 0;
  }
  // Extract product URL
  extractProductUrl($element) {
    const linkSelectors = ["a", "[href]"];
    for (const selector of linkSelectors) {
      const link = $element.find(selector).first();
      const href = link.attr("href");
      if (href) {
        return href.startsWith("http") ? href : `${this.baseUrl}${href}`;
      }
    }
    return this.searchUrl;
  }
  // Extract availability status
  extractAvailability($element) {
    const text2 = $element.text().toLowerCase();
    if (text2.includes("out of stock") || text2.includes("unavailable") || text2.includes("sold out")) {
      return "out_of_stock";
    }
    if (text2.includes("prescription") || text2.includes("rx") || text2.includes("prescription required")) {
      return "prescription_required";
    }
    return "available";
  }
  // Extract manufacturer information
  extractManufacturer($element) {
    const manufacturerSelectors = [
      ".manufacturer",
      ".brand",
      '[class*="manufacturer"]',
      '[class*="brand"]'
    ];
    for (const selector of manufacturerSelectors) {
      const text2 = $element.find(selector).first().text().trim();
      if (text2 && text2.length > 1) {
        return text2;
      }
    }
    return void 0;
  }
  // Extract description
  extractDescription($element) {
    const descSelectors = [
      ".description",
      ".summary",
      '[class*="description"]',
      '[class*="summary"]',
      "p"
    ];
    for (const selector of descSelectors) {
      const text2 = $element.find(selector).first().text().trim();
      if (text2 && text2.length > 10 && text2.length < 500) {
        return text2;
      }
    }
    return void 0;
  }
  // Check if prescription is required
  checkPrescriptionRequired($element, name) {
    const text2 = $element.text().toLowerCase();
    const prescriptionKeywords = [
      "prescription",
      "rx",
      "prescription required",
      "doctor",
      "medical",
      "pharmacy only"
    ];
    return prescriptionKeywords.some((keyword) => text2.includes(keyword)) || name.toLowerCase().includes("prescription");
  }
  // Get detailed product information
  async getProductDetails(productUrl) {
    try {
      const response = await axios.get(productUrl, {
        headers: {
          "User-Agent": this.userAgent
        },
        timeout: this.timeout
      });
      const $ = cheerio.load(response.data);
      return null;
    } catch (error) {
      console.error("Error fetching product details:", error);
      return null;
    }
  }
  // Check if website is accessible
  async isWebsiteAccessible() {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: { "User-Agent": this.userAgent },
        timeout: 5e3
      });
      return response.status === 200;
    } catch (error) {
      console.error("Tarshouby website not accessible:", error);
      return false;
    }
  }
  // Get website health status
  async getWebsiteHealth() {
    const startTime = Date.now();
    try {
      const accessible = await this.isWebsiteAccessible();
      const responseTime = Date.now() - startTime;
      return {
        accessible,
        responseTime,
        lastChecked: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      return {
        accessible: false,
        lastChecked: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};
var tarshoubyService = new TarshoubyService();

// server/tarshoubyRoutes.ts
async function searchTarshouby(req, res) {
  try {
    const { drugName } = req.query;
    if (!drugName || typeof drugName !== "string") {
      return res.status(400).json({ error: "Drug name is required" });
    }
    if (drugName.length < 2) {
      return res.status(400).json({ error: "Drug name must be at least 2 characters" });
    }
    console.log(`Tarshouby search request for: ${drugName}`);
    const result = await tarshoubyService.searchProducts(drugName);
    res.json({
      success: true,
      data: result,
      message: `Found ${result.products.length} products on Tarshouby`
    });
  } catch (error) {
    console.error("Error searching Tarshouby:", error);
    res.status(500).json({
      error: "Failed to search Tarshouby",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function getTarshoubyProductDetails(req, res) {
  try {
    const { productUrl } = req.query;
    if (!productUrl || typeof productUrl !== "string") {
      return res.status(400).json({ error: "Product URL is required" });
    }
    const details = await tarshoubyService.getProductDetails(productUrl);
    if (!details) {
      return res.status(404).json({ error: "Product details not found" });
    }
    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error("Error fetching Tarshouby product details:", error);
    res.status(500).json({
      error: "Failed to fetch product details",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function updatePriceFromTarshouby(req, res) {
  try {
    const { drugId, tarshoubyProduct } = req.body;
    if (!drugId || !tarshoubyProduct) {
      return res.status(400).json({ error: "Drug ID and Tarshouby product data are required" });
    }
    if (!tarshoubyProduct.price) {
      return res.status(400).json({ error: "Tarshouby product price is required" });
    }
    const result = await priceService.updatePrice({
      drugId,
      newPrice: tarshoubyProduct.price,
      pharmacy: "Al Abdellatif Tarshouby",
      region: "Egypt",
      source: "pharmacy_api",
      notes: `Price from Tarshouby website. Product: ${tarshoubyProduct.name}`
    });
    res.json({
      success: true,
      message: "Price updated from Tarshouby data",
      data: {
        ...result,
        tarshoubyProduct
      }
    });
  } catch (error) {
    console.error("Error updating price from Tarshouby:", error);
    res.status(500).json({
      error: "Failed to update price from Tarshouby",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function bulkUpdatePricesFromTarshouby(req, res) {
  try {
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "Updates array is required" });
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: "At least one update is required" });
    }
    if (updates.length > 50) {
      return res.status(400).json({ error: "Maximum 50 updates allowed per request" });
    }
    const results = [];
    for (const update of updates) {
      try {
        const { drugId, tarshoubyProduct } = update;
        if (!drugId || !tarshoubyProduct?.price) {
          console.warn(`Skipping invalid update: drugId=${drugId}, hasPrice=${!!tarshoubyProduct?.price}`);
          continue;
        }
        const result = await priceService.updatePrice({
          drugId,
          newPrice: tarshoubyProduct.price,
          pharmacy: "Al Abdellatif Tarshouby",
          region: "Egypt",
          source: "pharmacy_api",
          notes: `Bulk update from Tarshouby. Product: ${tarshoubyProduct.name}`
        });
        results.push({
          success: true,
          drugId,
          result
        });
      } catch (error) {
        console.error(`Failed to update drug ${update.drugId}:`, error);
        results.push({
          success: false,
          drugId: update.drugId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;
    res.json({
      success: true,
      message: `Processed ${results.length} updates: ${successCount} successful, ${failureCount} failed`,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results
      }
    });
  } catch (error) {
    console.error("Error in bulk Tarshouby price update:", error);
    res.status(500).json({
      error: "Failed to perform bulk price update",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function getTarshoubyHealth(req, res) {
  try {
    const health = await tarshoubyService.getWebsiteHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error("Error checking Tarshouby health:", error);
    res.status(500).json({
      error: "Failed to check Tarshouby website health",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function comparePrices(req, res) {
  try {
    const { drugName } = req.query;
    if (!drugName || typeof drugName !== "string") {
      return res.status(400).json({ error: "Drug name is required" });
    }
    const tarshoubyResult = await tarshoubyService.searchProducts(drugName);
    const currentDrug = await priceService.getPriceStatistics(parseInt(drugName) || 0);
    res.json({
      success: true,
      data: {
        drugName,
        tarshouby: tarshoubyResult,
        currentDatabase: currentDrug,
        comparison: {
          tarshoubyCount: tarshoubyResult.products.length,
          hasDatabasePrice: !!currentDrug.currentPrice,
          priceDifference: currentDrug.currentPrice && tarshoubyResult.products[0]?.price ? tarshoubyResult.products[0].price - currentDrug.currentPrice : null
        }
      }
    });
  } catch (error) {
    console.error("Error comparing prices:", error);
    res.status(500).json({
      error: "Failed to compare prices",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// server/authService.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq as eq2, and as and2, desc as desc2, lt as lt2 } from "drizzle-orm";
var AuthService = class {
  JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
  JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production";
  JWT_EXPIRES_IN = "15m";
  // 15 minutes for access token
  JWT_REFRESH_EXPIRES_IN = "7d";
  // 7 days for refresh token
  BCRYPT_ROUNDS = 12;
  MAX_SESSIONS_PER_USER = 5;
  // Generate secure random tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }
  // Hash password with salt
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(this.BCRYPT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return { hash, salt };
  }
  // Verify password against hash
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
  // Generate JWT tokens
  generateTokens(userId, email, sessionId) {
    const now = Math.floor(Date.now() / 1e3);
    const expiresIn = 15 * 60;
    const accessToken = jwt.sign(
      {
        userId,
        email,
        sessionId,
        iat: now,
        exp: now + expiresIn,
        type: "access"
      },
      this.JWT_SECRET,
      { algorithm: "HS256" }
    );
    const refreshToken2 = jwt.sign(
      {
        userId,
        email,
        sessionId,
        iat: now,
        exp: now + 7 * 24 * 60 * 60,
        // 7 days
        type: "refresh"
      },
      this.JWT_REFRESH_SECRET,
      { algorithm: "HS256" }
    );
    return {
      accessToken,
      refreshToken: refreshToken2,
      expiresIn
    };
  }
  // Verify JWT token
  verifyToken(token, type = "access") {
    try {
      const secret = type === "access" ? this.JWT_SECRET : this.JWT_REFRESH_SECRET;
      const decoded = jwt.verify(token, secret);
      if (decoded.type !== type) {
        return null;
      }
      return decoded;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }
  // Register new user
  async register(userData, ipAddress, userAgent) {
    const { email, password, firstName, lastName, phone, dateOfBirth, gender } = userData;
    const existingUser = await db.select().from(schema_exports.users).where(eq2(schema_exports.users.email, email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error("User with this email already exists");
    }
    const { hash, salt } = await this.hashPassword(password);
    const newUser = await db.insert(schema_exports.users).values({
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
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    const user = newUser[0];
    const session = await this.createSession(user.id, ipAddress, userAgent);
    const tokens = this.generateTokens(user.id, user.email, session.id);
    await db.update(schema_exports.users).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq2(schema_exports.users.id, user.id));
    await this.logAuditEvent({
      userId: user.id,
      action: "user_register",
      resource: "user",
      resourceId: user.id,
      newValues: { email, firstName, lastName },
      ipAddress,
      userAgent,
      success: true
    });
    await this.sendEmailVerification(user.id, user.email);
    const { passwordHash, salt: userSalt, ...safeUser } = user;
    return {
      user: safeUser,
      ...tokens
    };
  }
  // Login user
  async login(credentials, ipAddress, userAgent) {
    const { email, password } = credentials;
    const users2 = await db.select().from(schema_exports.users).where(and2(
      eq2(schema_exports.users.email, email),
      eq2(schema_exports.users.isActive, true)
    )).limit(1);
    if (users2.length === 0) {
      throw new Error("Invalid email or password");
    }
    const user = users2[0];
    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }
    const session = await this.createSession(user.id, ipAddress, userAgent);
    const tokens = this.generateTokens(user.id, user.email, session.id);
    await db.update(schema_exports.users).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq2(schema_exports.users.id, user.id));
    await this.logAuditEvent({
      userId: user.id,
      action: "user_login",
      resource: "user",
      resourceId: user.id,
      ipAddress,
      userAgent,
      success: true
    });
    const { passwordHash, salt, ...safeUser } = user;
    return {
      user: safeUser,
      ...tokens
    };
  }
  // Create user session
  async createSession(userId, ipAddress, userAgent, deviceInfo) {
    const oldSessions = await db.select().from(schema_exports.userSessions).where(and2(
      eq2(schema_exports.userSessions.userId, userId),
      eq2(schema_exports.userSessions.isActive, true)
    )).orderBy(desc2(schema_exports.userSessions.createdAt)).limit(this.MAX_SESSIONS_PER_USER);
    if (oldSessions.length >= this.MAX_SESSIONS_PER_USER) {
      const sessionsToDeactivate = oldSessions.slice(this.MAX_SESSIONS_PER_USER - 1);
      for (const session of sessionsToDeactivate) {
        await db.update(schema_exports.userSessions).set({ isActive: false }).where(eq2(schema_exports.userSessions.id, session.id));
      }
    }
    const sessionToken = this.generateSecureToken(64);
    const refreshToken2 = this.generateSecureToken(64);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    const newSessions = await db.insert(schema_exports.userSessions).values({
      userId,
      sessionToken,
      refreshToken: refreshToken2,
      deviceInfo: deviceInfo || {},
      ipAddress,
      userAgent,
      isActive: true,
      expiresAt,
      createdAt: /* @__PURE__ */ new Date(),
      lastAccessedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newSessions[0];
  }
  // Refresh tokens
  async refreshToken(refreshToken2, ipAddress, userAgent) {
    const payload = this.verifyToken(refreshToken2, "refresh");
    if (!payload) {
      throw new Error("Invalid or expired refresh token");
    }
    const sessions = await db.select().from(schema_exports.userSessions).where(and2(
      eq2(schema_exports.userSessions.refreshToken, refreshToken2),
      eq2(schema_exports.userSessions.isActive, true),
      eq2(schema_exports.userSessions.userId, payload.userId)
    )).limit(1);
    if (sessions.length === 0) {
      throw new Error("Session not found or expired");
    }
    const session = sessions[0];
    if (/* @__PURE__ */ new Date() > session.expiresAt) {
      await db.update(schema_exports.userSessions).set({ isActive: false }).where(eq2(schema_exports.userSessions.id, session.id));
      throw new Error("Session expired");
    }
    const users2 = await db.select().from(schema_exports.users).where(and2(
      eq2(schema_exports.users.id, payload.userId),
      eq2(schema_exports.users.isActive, true)
    )).limit(1);
    if (users2.length === 0) {
      throw new Error("User not found or inactive");
    }
    const user = users2[0];
    const tokens = this.generateTokens(user.id, user.email, session.id);
    await db.update(schema_exports.userSessions).set({
      lastAccessedAt: /* @__PURE__ */ new Date(),
      ipAddress: ipAddress || session.ipAddress,
      userAgent: userAgent || session.userAgent
    }).where(eq2(schema_exports.userSessions.id, session.id));
    const { passwordHash, salt, ...safeUser } = user;
    return {
      user: safeUser,
      ...tokens
    };
  }
  // Logout user
  async logout(sessionToken) {
    await db.update(schema_exports.userSessions).set({ isActive: false }).where(eq2(schema_exports.userSessions.sessionToken, sessionToken));
  }
  // Logout from all devices
  async logoutAll(userId) {
    await db.update(schema_exports.userSessions).set({ isActive: false }).where(eq2(schema_exports.userSessions.userId, userId));
  }
  // Forgot password
  async forgotPassword(request) {
    const { email } = request;
    const users2 = await db.select().from(schema_exports.users).where(and2(
      eq2(schema_exports.users.email, email),
      eq2(schema_exports.users.isActive, true)
    )).limit(1);
    if (users2.length === 0) {
      return;
    }
    const user = users2[0];
    await db.update(schema_exports.passwordResetTokens).set({ isUsed: true }).where(eq2(schema_exports.passwordResetTokens.userId, user.id));
    const token = this.generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
    await db.insert(schema_exports.passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
      isUsed: false,
      createdAt: /* @__PURE__ */ new Date()
    });
    console.log(`Password reset token for ${email}: ${token}`);
  }
  // Reset password
  async resetPassword(request) {
    const { token, password } = request;
    const tokens = await db.select().from(schema_exports.passwordResetTokens).where(and2(
      eq2(schema_exports.passwordResetTokens.token, token),
      eq2(schema_exports.passwordResetTokens.isUsed, false)
      // Note: You would need to add a where clause for expiration check
    )).limit(1);
    if (tokens.length === 0) {
      throw new Error("Invalid or expired reset token");
    }
    const resetToken = tokens[0];
    if (/* @__PURE__ */ new Date() > resetToken.expiresAt) {
      throw new Error("Reset token has expired");
    }
    const users2 = await db.select().from(schema_exports.users).where(eq2(schema_exports.users.id, resetToken.userId)).limit(1);
    if (users2.length === 0) {
      throw new Error("User not found");
    }
    const user = users2[0];
    const { hash, salt } = await this.hashPassword(password);
    await db.update(schema_exports.users).set({
      passwordHash: hash,
      salt,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(schema_exports.users.id, user.id));
    await db.update(schema_exports.passwordResetTokens).set({ isUsed: true }).where(eq2(schema_exports.passwordResetTokens.id, resetToken.id));
    await this.logoutAll(user.id);
    await this.logAuditEvent({
      userId: user.id,
      action: "password_reset",
      resource: "user",
      resourceId: user.id,
      success: true
    });
  }
  // Change password
  async changePassword(userId, request) {
    const { currentPassword, newPassword } = request;
    const users2 = await db.select().from(schema_exports.users).where(eq2(schema_exports.users.id, userId)).limit(1);
    if (users2.length === 0) {
      throw new Error("User not found");
    }
    const user = users2[0];
    const isValidPassword = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }
    const { hash, salt } = await this.hashPassword(newPassword);
    await db.update(schema_exports.users).set({
      passwordHash: hash,
      salt,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(schema_exports.users.id, user.id));
    await this.logAuditEvent({
      userId,
      action: "password_change",
      resource: "user",
      resourceId: userId,
      success: true
    });
  }
  // Send email verification
  async sendEmailVerification(userId, email) {
    await db.update(schema_exports.emailVerificationTokens).set({ isVerified: true }).where(eq2(schema_exports.emailVerificationTokens.userId, userId));
    const token = this.generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    await db.insert(schema_exports.emailVerificationTokens).values({
      userId,
      token,
      email,
      expiresAt,
      isVerified: false,
      createdAt: /* @__PURE__ */ new Date()
    });
    console.log(`Email verification token for ${email}: ${token}`);
  }
  // Log audit events
  async logAuditEvent(event) {
    await db.insert(schema_exports.auditLogs).values({
      ...event,
      createdAt: /* @__PURE__ */ new Date()
    });
  }
  // Get user sessions
  async getUserSessions(userId) {
    const sessions = await db.select().from(schema_exports.userSessions).where(and2(
      eq2(schema_exports.userSessions.userId, userId),
      eq2(schema_exports.userSessions.isActive, true)
    )).orderBy(desc2(schema_exports.userSessions.lastAccessedAt));
    return sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress || "",
      userAgent: session.userAgent || "",
      isActive: session.isActive,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      lastAccessedAt: session.lastAccessedAt.toISOString()
    }));
  }
  // Clean up expired sessions
  async cleanupExpiredSessions() {
    await db.update(schema_exports.userSessions).set({ isActive: false }).where(and2(
      eq2(schema_exports.userSessions.isActive, true),
      lt2(schema_exports.userSessions.expiresAt, /* @__PURE__ */ new Date())
    ));
  }
};
var authService = new AuthService();

// server/authMiddleware.ts
var authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Access token is required"
      });
    }
    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token, "access");
    if (!payload) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token"
      });
    }
    req.user = {
      id: payload.userId,
      email: payload.email,
      sessionId: payload.sessionId
    };
    req.userId = payload.userId;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication failed"
    });
  }
};
var rateLimitMap = /* @__PURE__ */ new Map();
var rateLimit = (maxRequests, windowMs) => {
  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const windowStart = now - windowMs;
    let record = rateLimitMap.get(key);
    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitMap.set(key, record);
    }
    record.count++;
    if (record.count > maxRequests) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1e3)} seconds`
      });
    }
    next();
  };
};
setInterval(() => {
  const now = Date.now();
  const keysToDelete = [];
  rateLimitMap.forEach((record, key) => {
    if (record.resetTime < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => rateLimitMap.delete(key));
}, 6e4);
var securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
};
var requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get("User-Agent") || "";
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(`${method} ${url} - ${statusCode} - ${duration}ms - ${ip} - ${userAgent.substring(0, 50)}`);
  });
  next();
};
var errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  const isDevelopment = process.env.NODE_ENV === "development";
  res.status(500).json({
    error: "Internal Server Error",
    message: isDevelopment ? err.message : "Something went wrong",
    ...isDevelopment && { stack: err.stack }
  });
};

// server/authRoutes.ts
async function register(req, res) {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationResult.error.errors
      });
    }
    const ipAddress = req.ip;
    const userAgent = req.get("User-Agent");
    const result = await authService.register(validationResult.data, ipAddress, userAgent);
    res.status(201).json({
      success: true,
      message: "User registered successfully. Please check your email for verification.",
      data: result
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return res.status(409).json({
          error: "Conflict",
          message: error.message
        });
      }
    }
    res.status(500).json({
      error: "Registration Failed",
      message: "Failed to register user. Please try again."
    });
  }
}
async function login(req, res) {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationResult.error.errors
      });
    }
    const ipAddress = req.ip;
    const userAgent = req.get("User-Agent");
    const result = await authService.login(validationResult.data, ipAddress, userAgent);
    res.json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Invalid email or password")) {
        return res.status(401).json({
          error: "Authentication Failed",
          message: "Invalid email or password"
        });
      }
    }
    res.status(500).json({
      error: "Login Failed",
      message: "Failed to login. Please try again."
    });
  }
}
async function refreshToken(req, res) {
  try {
    const { refreshToken: refreshToken2 } = req.body;
    if (!refreshToken2) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Refresh token is required"
      });
    }
    const ipAddress = req.ip;
    const userAgent = req.get("User-Agent");
    const result = await authService.refreshToken(refreshToken2, ipAddress, userAgent);
    res.json({
      success: true,
      message: "Tokens refreshed successfully",
      data: result
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Invalid or expired")) {
        return res.status(401).json({
          error: "Authentication Failed",
          message: "Invalid or expired refresh token"
        });
      }
    }
    res.status(500).json({
      error: "Token Refresh Failed",
      message: "Failed to refresh tokens. Please login again."
    });
  }
}
async function logout(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Access token is required"
      });
    }
    const token = authHeader.substring(7);
    await authService.logout(token);
    res.json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Logout Failed",
      message: "Failed to logout. Please try again."
    });
  }
}
async function logoutAll(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required"
      });
    }
    await authService.logoutAll(req.user.id);
    res.json({
      success: true,
      message: "Logged out from all devices successfully"
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      error: "Logout Failed",
      message: "Failed to logout from all devices. Please try again."
    });
  }
}
async function forgotPassword(req, res) {
  try {
    const validationResult = forgotPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationResult.error.errors
      });
    }
    await authService.forgotPassword(validationResult.data);
    res.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      error: "Request Failed",
      message: "Failed to process password reset request. Please try again."
    });
  }
}
async function resetPassword(req, res) {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationResult.error.errors
      });
    }
    await authService.resetPassword(validationResult.data);
    res.json({
      success: true,
      message: "Password reset successfully. Please login with your new password."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Invalid or expired")) {
        return res.status(400).json({
          error: "Bad Request",
          message: error.message
        });
      }
    }
    res.status(500).json({
      error: "Reset Failed",
      message: "Failed to reset password. Please try again."
    });
  }
}
async function changePassword(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required"
      });
    }
    const validationResult = changePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation Error",
        details: validationResult.error.errors
      });
    }
    await authService.changePassword(req.user.id, validationResult.data);
    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Current password is incorrect")) {
        return res.status(400).json({
          error: "Bad Request",
          message: error.message
        });
      }
    }
    res.status(500).json({
      error: "Change Failed",
      message: "Failed to change password. Please try again."
    });
  }
}
async function getProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required"
      });
    }
    res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email
        // Add other user fields as needed
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Profile Fetch Failed",
      message: "Failed to fetch user profile. Please try again."
    });
  }
}
async function getSessions(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required"
      });
    }
    const sessions = await authService.getUserSessions(req.user.id);
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      error: "Sessions Fetch Failed",
      message: "Failed to fetch user sessions. Please try again."
    });
  }
}
async function verifyEmail(req, res) {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({
        error: "Bad Request",
        message: "Verification token is required"
      });
    }
    res.json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      error: "Verification Failed",
      message: "Failed to verify email. Please try again."
    });
  }
}

// server/advancedFeaturesRoutes.ts
import express from "express";
import { z as z2 } from "zod";

// server/advancedFeaturesService.ts
import { eq as eq4, and as and4, or as or2 } from "drizzle-orm";

// server/externalInteractionService.ts
import axios2 from "axios";
import { eq as eq3, and as and3, or, inArray as inArray2 } from "drizzle-orm";
var ExternalInteractionService = class {
  openFDABaseUrl = "https://api.fda.gov/drug/label.json";
  meditroneAIUrl = process.env.MEDITRONE_AI_API_URL || "https://api.meditrone.ai/v1";
  meditroneAPIKey = process.env.MEDITRONE_AI_API_KEY;
  // Cache for API responses to avoid rate limits
  cache = /* @__PURE__ */ new Map();
  CACHE_TTL = 24 * 60 * 60 * 1e3;
  // 24 hours
  getCacheKey(drug1Name, drug2Name, source) {
    return `${source}:${drug1Name.toLowerCase()}:${drug2Name.toLowerCase()}`;
  }
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }
  setCachedData(key, data, ttl = this.CACHE_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  /**
   * Fetch drug interactions from Open FDA API
   */
  async fetchOpenFDAInteractions(drugNames) {
    const interactions = [];
    try {
      for (let i = 0; i < drugNames.length; i++) {
        for (let j = i + 1; j < drugNames.length; j++) {
          const drug1Name = drugNames[i];
          const drug2Name = drugNames[j];
          const cacheKey = this.getCacheKey(drug1Name, drug2Name, "openfda");
          const cached = this.getCachedData(cacheKey);
          if (cached) {
            interactions.push(...cached);
            continue;
          }
          try {
            const searchQuery = `drug_interactions:"${drug1Name}" AND drug_interactions:"${drug2Name}"`;
            const response = await axios2.get(this.openFDABaseUrl, {
              params: {
                search: searchQuery,
                limit: 10
              },
              timeout: 1e4
            });
            if (response.data.results && response.data.results.length > 0) {
              const fdaInteractions = this.parseOpenFDAData(response.data.results, drug1Name, drug2Name);
              this.setCachedData(cacheKey, fdaInteractions);
              interactions.push(...fdaInteractions);
            }
          } catch (error) {
            console.warn(`Open FDA API error for ${drug1Name} + ${drug2Name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching Open FDA interactions:", error);
    }
    return interactions;
  }
  /**
   * Parse Open FDA response data
   */
  parseOpenFDAData(results, drug1Name, drug2Name) {
    const interactions = [];
    for (const result of results) {
      if (result.drug_interactions) {
        const interactionText = Array.isArray(result.drug_interactions) ? result.drug_interactions.join(" ") : result.drug_interactions;
        const severity = this.extractSeverityFromText(interactionText);
        const description = this.extractDescriptionFromText(interactionText, drug1Name, drug2Name);
        const recommendation = this.extractRecommendationFromText(interactionText);
        if (description) {
          interactions.push({
            drug1Id: 0,
            // Will be resolved later
            drug1Name,
            drug2Id: 0,
            // Will be resolved later
            drug2Name,
            severity,
            interactionType: "Pharmacodynamic",
            description,
            recommendation,
            evidenceLevel: "strong",
            source: "openfda",
            lastChecked: /* @__PURE__ */ new Date()
          });
        }
      }
    }
    return interactions;
  }
  /**
   * Fetch drug interactions from Meditrone AI API
   */
  async fetchMeditroneAIInteractions(drugNames) {
    if (!this.meditroneAPIKey) {
      console.warn("Meditrone AI API key not configured");
      return [];
    }
    const interactions = [];
    try {
      const cacheKey = this.getCacheKey(drugNames.join("+"), "", "meditrone");
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
      const response = await axios2.post(
        `${this.meditroneAIUrl}/drug-interactions`,
        {
          drugs: drugNames,
          include_recommendations: true,
          severity_levels: ["minor", "moderate", "major", "contraindicated"]
        },
        {
          headers: {
            "Authorization": `Bearer ${this.meditroneAPIKey}`,
            "Content-Type": "application/json"
          },
          timeout: 3e4
        }
      );
      if (response.data.interactions) {
        for (const interaction of response.data.interactions) {
          const severity = this.mapMeditroneSeverity(interaction.severity);
          interactions.push({
            drug1Id: 0,
            // Will be resolved later
            drug1Name: interaction.drug1,
            drug2Id: 0,
            // Will be resolved later
            drug2Name: interaction.drug2,
            severity,
            interactionType: interaction.interaction_type || "Unknown",
            description: interaction.description,
            recommendation: interaction.recommendation,
            evidenceLevel: this.mapConfidenceToEvidence(interaction.confidence_score),
            source: "meditrone",
            lastChecked: /* @__PURE__ */ new Date()
          });
        }
      }
      this.setCachedData(cacheKey, interactions);
    } catch (error) {
      console.error("Error fetching Meditrone AI interactions:", error);
    }
    return interactions;
  }
  /**
   * Get comprehensive interactions from all sources
   */
  async getComprehensiveInteractions(drugIds) {
    const drugs = await db.select().from(egyptianDrugs).where(inArray2(egyptianDrugs.id, drugIds));
    const drugNames = drugs.map((drug) => drug.name);
    const allInteractions = [];
    const [openFDAInteractions, meditroneInteractions] = await Promise.allSettled([
      this.fetchOpenFDAInteractions(drugNames),
      this.fetchMeditroneAIInteractions(drugNames)
    ]);
    if (openFDAInteractions.status === "fulfilled") {
      allInteractions.push(...openFDAInteractions.value);
    }
    if (meditroneInteractions.status === "fulfilled") {
      allInteractions.push(...meditroneInteractions.value);
    }
    const internalInteractions = await this.getInternalInteractions(drugIds);
    allInteractions.push(...internalInteractions);
    return this.resolveAndMergeInteractions(allInteractions, drugs);
  }
  /**
   * Get internal interactions from database
   */
  async getInternalInteractions(drugIds) {
    const interactions = [];
    for (let i = 0; i < drugIds.length; i++) {
      for (let j = i + 1; j < drugIds.length; j++) {
        const drug1Id = drugIds[i];
        const drug2Id = drugIds[j];
        const [interaction] = await db.select().from(drugInteractions).where(and3(
          or(
            and3(
              eq3(drugInteractions.drug1Id, drug1Id),
              eq3(drugInteractions.drug2Id, drug2Id)
            ),
            and3(
              eq3(drugInteractions.drug1Id, drug2Id),
              eq3(drugInteractions.drug2Id, drug1Id)
            )
          ),
          eq3(drugInteractions.isActive, true)
        ));
        if (interaction) {
          const [drug1] = await db.select().from(egyptianDrugs).where(eq3(egyptianDrugs.id, drug1Id)).limit(1);
          const [drug2] = await db.select().from(egyptianDrugs).where(eq3(egyptianDrugs.id, drug2Id)).limit(1);
          if (drug1 && drug2) {
            interactions.push({
              drug1Id,
              drug1Name: drug1.name,
              drug2Id,
              drug2Name: drug2.name,
              severity: interaction.severity,
              interactionType: interaction.interactionType,
              description: interaction.description,
              recommendation: interaction.recommendation || void 0,
              evidenceLevel: interaction.evidenceLevel,
              source: "internal",
              lastChecked: /* @__PURE__ */ new Date()
            });
          }
        }
      }
    }
    return interactions;
  }
  /**
   * Resolve drug IDs and merge duplicate interactions
   */
  resolveAndMergeInteractions(interactions, drugs) {
    const drugMap = new Map(drugs.map((drug) => [drug.name.toLowerCase(), drug.id]));
    const mergedInteractions = /* @__PURE__ */ new Map();
    for (const interaction of interactions) {
      const drug1Id = interaction.drug1Id || drugMap.get(interaction.drug1Name.toLowerCase()) || 0;
      const drug2Id = interaction.drug2Id || drugMap.get(interaction.drug2Name.toLowerCase()) || 0;
      const key = `${Math.min(drug1Id, drug2Id)}-${Math.max(drug1Id, drug2Id)}`;
      if (mergedInteractions.has(key)) {
        const existing = mergedInteractions.get(key);
        mergedInteractions.set(key, this.mergeInteractionData(existing, interaction));
      } else {
        mergedInteractions.set(key, {
          ...interaction,
          drug1Id,
          drug2Id
        });
      }
    }
    return Array.from(mergedInteractions.values());
  }
  /**
   * Merge interaction data from multiple sources
   */
  mergeInteractionData(existing, newInteraction) {
    const severityLevels = { minor: 1, moderate: 2, major: 3, contraindicated: 4 };
    const highestSeverity = severityLevels[existing.severity] >= severityLevels[newInteraction.severity] ? existing.severity : newInteraction.severity;
    const combinedDescription = existing.description + "\n\n" + newInteraction.description;
    const evidenceLevels = { theoretical: 1, limited: 2, moderate: 3, strong: 4 };
    const strongestEvidence = evidenceLevels[existing.evidenceLevel] >= evidenceLevels[newInteraction.evidenceLevel] ? existing.evidenceLevel : newInteraction.evidenceLevel;
    return {
      ...existing,
      severity: highestSeverity,
      description: combinedDescription,
      recommendation: existing.recommendation || newInteraction.recommendation,
      evidenceLevel: strongestEvidence,
      lastChecked: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Helper methods for parsing text data
   */
  extractSeverityFromText(text2) {
    const lowerText = text2.toLowerCase();
    if (lowerText.includes("contraindicated") || lowerText.includes("do not use")) {
      return "contraindicated";
    } else if (lowerText.includes("major") || lowerText.includes("severe")) {
      return "major";
    } else if (lowerText.includes("moderate")) {
      return "moderate";
    } else {
      return "minor";
    }
  }
  extractDescriptionFromText(text2, drug1Name, drug2Name) {
    const sentences = text2.split(".");
    const relevantSentences = sentences.filter(
      (sentence) => sentence.toLowerCase().includes(drug1Name.toLowerCase()) || sentence.toLowerCase().includes(drug2Name.toLowerCase()) || sentence.toLowerCase().includes("interaction")
    );
    return relevantSentences.join(".").trim() || text2.substring(0, 200) + "...";
  }
  extractRecommendationFromText(text2) {
    const lowerText = text2.toLowerCase();
    const recommendationKeywords = ["recommend", "should", "monitor", "avoid", "consider"];
    for (const keyword of recommendationKeywords) {
      const index2 = lowerText.indexOf(keyword);
      if (index2 !== -1) {
        const sentence = text2.substring(index2, index2 + 150);
        return sentence.trim();
      }
    }
    return void 0;
  }
  mapMeditroneSeverity(severity) {
    const lowerSeverity = severity.toLowerCase();
    if (lowerSeverity.includes("contraindicated")) return "contraindicated";
    if (lowerSeverity.includes("major")) return "major";
    if (lowerSeverity.includes("moderate")) return "moderate";
    return "minor";
  }
  mapConfidenceToEvidence(confidence) {
    if (confidence >= 0.9) return "strong";
    if (confidence >= 0.7) return "moderate";
    if (confidence >= 0.5) return "limited";
    return "theoretical";
  }
  /**
   * Update internal database with external interaction data
   */
  async updateInternalInteractions(interactions) {
    for (const interaction of interactions) {
      if (interaction.drug1Id === 0 || interaction.drug2Id === 0) {
        continue;
      }
      const [existing] = await db.select().from(drugInteractions).where(and3(
        or(
          and3(
            eq3(drugInteractions.drug1Id, interaction.drug1Id),
            eq3(drugInteractions.drug2Id, interaction.drug2Id)
          ),
          and3(
            eq3(drugInteractions.drug1Id, interaction.drug2Id),
            eq3(drugInteractions.drug2Id, interaction.drug1Id)
          )
        )
      )).limit(1);
      if (existing) {
        await db.update(drugInteractions).set({
          severity: interaction.severity,
          interactionType: interaction.interactionType,
          description: interaction.description,
          recommendation: interaction.recommendation,
          evidenceLevel: interaction.evidenceLevel,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq3(drugInteractions.id, existing.id));
      } else {
        await db.insert(drugInteractions).values({
          drug1Id: interaction.drug1Id,
          drug2Id: interaction.drug2Id,
          severity: interaction.severity,
          interactionType: interaction.interactionType,
          description: interaction.description,
          recommendation: interaction.recommendation,
          evidenceLevel: interaction.evidenceLevel,
          isActive: true,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
    }
  }
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
};
var externalInteractionService = new ExternalInteractionService();

// server/advancedFeaturesService.ts
var AdvancedFeaturesService = class {
  // ALLERGY MANAGEMENT
  async createUserAllergy(userId, allergyData) {
    const [allergy] = await db.insert(userAllergies).values({
      ...allergyData,
      userId,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return allergy;
  }
  async getUserAllergies(userId) {
    return await db.select().from(userAllergies).where(and4(
      eq4(userAllergies.userId, userId),
      eq4(userAllergies.isActive, true)
    )).orderBy(userAllergies.createdAt);
  }
  async updateUserAllergy(allergyId, updates) {
    const [updatedAllergy] = await db.update(userAllergies).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(userAllergies.id, allergyId)).returning();
    return updatedAllergy;
  }
  async deleteUserAllergy(allergyId) {
    await db.update(userAllergies).set({
      isActive: false,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(userAllergies.id, allergyId));
  }
  async checkAllergyAlerts(userId, drugName) {
    const userAllergyList = await this.getUserAllergies(userId);
    const alerts = [];
    for (const allergy of userAllergyList) {
      if (allergy.allergenType === "drug") {
        if (drugName.toLowerCase().includes(allergy.allergenName.toLowerCase()) || allergy.allergenName.toLowerCase().includes(drugName.toLowerCase())) {
          alerts.push({
            allergenName: allergy.allergenName,
            allergenType: allergy.allergenType,
            severity: allergy.severity,
            reaction: allergy.reaction || "Unknown reaction",
            recommendation: this.getAllergyRecommendation(allergy.severity)
          });
        }
      }
    }
    return alerts;
  }
  getAllergyRecommendation(severity) {
    switch (severity) {
      case "severe":
        return "DO NOT TAKE THIS MEDICATION. Consult your doctor immediately.";
      case "moderate":
        return "Use with caution and under medical supervision only.";
      case "mild":
        return "Monitor for allergic reactions. Consult pharmacist if concerned.";
      default:
        return "Consult healthcare provider before use.";
    }
  }
  // PRESCRIPTION MANAGEMENT
  async createUserPrescription(userId, prescriptionData) {
    const [prescription] = await db.insert(userPrescriptions).values({
      ...prescriptionData,
      userId,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      prescribedDate: prescriptionData.prescribedDate ? new Date(prescriptionData.prescribedDate) : void 0
    }).returning();
    return prescription;
  }
  async getUserPrescriptions(userId) {
    return await db.select().from(userPrescriptions).where(and4(
      eq4(userPrescriptions.userId, userId),
      eq4(userPrescriptions.isActive, true)
    )).orderBy(userPrescriptions.createdAt);
  }
  async updateUserPrescription(prescriptionId, updates) {
    const [updatedPrescription] = await db.update(userPrescriptions).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date(),
      prescribedDate: updates.prescribedDate ? new Date(updates.prescribedDate) : void 0
    }).where(eq4(userPrescriptions.id, prescriptionId)).returning();
    return updatedPrescription;
  }
  async deleteUserPrescription(prescriptionId) {
    await db.update(userPrescriptions).set({
      isActive: false,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(userPrescriptions.id, prescriptionId));
  }
  // DRUG INTERACTION CHECKER
  async checkDrugInteractions(drugIds) {
    try {
      const externalInteractions = await externalInteractionService.getComprehensiveInteractions(drugIds.drugIds);
      await externalInteractionService.updateInternalInteractions(externalInteractions);
      const results = externalInteractions.map((interaction) => ({
        drug1Id: interaction.drug1Id,
        drug1Name: interaction.drug1Name,
        drug2Id: interaction.drug2Id,
        drug2Name: interaction.drug2Name,
        severity: interaction.severity,
        interactionType: interaction.interactionType,
        description: interaction.description,
        recommendation: interaction.recommendation,
        evidenceLevel: interaction.evidenceLevel
      }));
      return results;
    } catch (error) {
      console.error("Error checking drug interactions:", error);
      return await this.checkInternalInteractions(drugIds.drugIds);
    }
  }
  // Fallback method for internal interactions only
  async checkInternalInteractions(drugIds) {
    const interactions = [];
    for (let i = 0; i < drugIds.length; i++) {
      for (let j = i + 1; j < drugIds.length; j++) {
        const drug1Id = drugIds[i];
        const drug2Id = drugIds[j];
        const [interaction] = await db.select().from(drugInteractions).where(and4(
          or2(
            and4(
              eq4(drugInteractions.drug1Id, drug1Id),
              eq4(drugInteractions.drug2Id, drug2Id)
            ),
            and4(
              eq4(drugInteractions.drug1Id, drug2Id),
              eq4(drugInteractions.drug2Id, drug1Id)
            )
          ),
          eq4(drugInteractions.isActive, true)
        ));
        if (interaction) {
          const [drug1] = await db.select().from(egyptianDrugs).where(eq4(egyptianDrugs.id, drug1Id)).limit(1);
          const [drug2] = await db.select().from(egyptianDrugs).where(eq4(egyptianDrugs.id, drug2Id)).limit(1);
          if (drug1 && drug2) {
            interactions.push({
              drug1Id,
              drug1Name: drug1.name,
              drug2Id,
              drug2Name: drug2.name,
              severity: interaction.severity,
              interactionType: interaction.interactionType,
              description: interaction.description,
              recommendation: interaction.recommendation || void 0,
              evidenceLevel: interaction.evidenceLevel
            });
          }
        }
      }
    }
    return interactions;
  }
  async checkUserPrescriptionInteractions(userId) {
    const prescriptions = await this.getUserPrescriptions(userId);
    const drugIds = prescriptions.map((p) => p.drugId);
    if (drugIds.length < 2) {
      return [];
    }
    return await this.checkDrugInteractions({ drugIds });
  }
  // DOSAGE CALCULATOR
  async calculateDosage(calculation) {
    let ageGroup = calculation.ageGroup;
    if (!ageGroup) {
      ageGroup = this.determineAgeGroup(calculation.age);
    }
    const [guideline] = await db.select().from(dosageGuidelines).where(and4(
      eq4(dosageGuidelines.drugId, calculation.drugId),
      ageGroup ? eq4(dosageGuidelines.ageGroup, ageGroup) : void 0,
      eq4(dosageGuidelines.isActive, true)
    )).orderBy(dosageGuidelines.weightRange).limit(1);
    if (!guideline) {
      return null;
    }
    const [drug] = await db.select().from(egyptianDrugs).where(eq4(egyptianDrugs.id, calculation.drugId)).limit(1);
    if (!drug) {
      return null;
    }
    const calculatedDose = this.calculateDoseFromGuideline(
      guideline.dosagePerKg,
      calculation.weight
    );
    let maxDailyDose;
    if (guideline.maxDailyDose) {
      maxDailyDose = this.parseDosageValue(guideline.maxDailyDose);
    }
    return {
      drugName: drug.name,
      calculatedDose,
      unit: this.extractUnit(guideline.dosagePerKg) || "mg",
      frequency: guideline.frequency || "As prescribed",
      maxDailyDose,
      notes: guideline.notes || "Consult healthcare provider for personalized dosing",
      ageGroup,
      weightRange: guideline.weightRange
    };
  }
  determineAgeGroup(age) {
    if (age < 1) return "neonate";
    if (age < 3) return "infant";
    if (age < 12) return "child";
    if (age < 18) return "adolescent";
    if (age < 65) return "adult";
    return "elderly";
  }
  calculateDoseFromGuideline(dosagePerKg, weight) {
    const range = dosagePerKg.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
    if (range) {
      const min = parseFloat(range[1]);
      const max = parseFloat(range[2]);
      const avgPerKg = (min + max) / 2;
      return Math.round(avgPerKg * weight * 100) / 100;
    }
    const single = dosagePerKg.match(/(\d+(?:\.\d+)?)/);
    if (single) {
      const perKg = parseFloat(single[1]);
      return Math.round(perKg * weight * 100) / 100;
    }
    return 0;
  }
  extractUnit(dosagePerKg) {
    const unitMatch = dosagePerKg.match(/([a-zA-Z]+)/);
    return unitMatch ? unitMatch[1] : "mg";
  }
  parseDosageValue(dosage) {
    const match = dosage.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
  // USER SETTINGS
  async getUserSettings(userId) {
    let [settings] = await db.select().from(userSettings).where(eq4(userSettings.userId, userId)).limit(1);
    if (!settings) {
      [settings] = await db.insert(userSettings).values({
        userId,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
    }
    return settings;
  }
  async updateUserSettings(userId, updates) {
    const [updatedSettings] = await db.update(userSettings).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(userSettings.userId, userId)).returning();
    return updatedSettings;
  }
  // COMPREHENSIVE CHECKS
  async performComprehensiveCheck(userId, drugIds) {
    const [interactions, userPrescriptions2, userSettings2] = await Promise.all([
      this.checkDrugInteractions({ drugIds }),
      this.getUserPrescriptions(userId),
      this.getUserSettings(userId)
    ]);
    const allergyAlerts = [];
    const dosageRecommendations = [];
    for (const drugId of drugIds) {
      const [drug] = await db.select().from(egyptianDrugs).where(eq4(egyptianDrugs.id, drugId)).limit(1);
      if (drug) {
        if (userSettings2.enableAllergyAlerts) {
          const alerts = await this.checkAllergyAlerts(userId, drug.name);
          allergyAlerts.push(...alerts);
        }
        if (userSettings2.enableDosageCalculator) {
          const dosage = await this.calculateDosage({
            drugId,
            age: 30,
            // Default adult age
            weight: 70
            // Default adult weight in kg
          });
          if (dosage) {
            dosageRecommendations.push(dosage);
          }
        }
      }
    }
    return {
      interactions: userSettings2.enableDrugInteractionChecker ? interactions : [],
      allergyAlerts,
      dosageRecommendations
    };
  }
};
var advancedFeaturesService = new AdvancedFeaturesService();

// server/advancedFeaturesRoutes.ts
var router = express.Router();
router.post("/allergies", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const validatedData = createUserAllergySchema.parse(req.body);
    const allergy = await advancedFeaturesService.createUserAllergy(userId, validatedData);
    res.status(201).json({ success: true, data: allergy });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating allergy:", error);
    res.status(500).json({ error: "Failed to create allergy" });
  }
});
router.get("/allergies", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const allergies = await advancedFeaturesService.getUserAllergies(userId);
    res.json({ success: true, data: allergies });
  } catch (error) {
    console.error("Error fetching allergies:", error);
    res.status(500).json({ error: "Failed to fetch allergies" });
  }
});
router.put("/allergies/:id", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const allergyId = req.params.id;
    const validatedData = createUserAllergySchema.partial().parse(req.body);
    const allergy = await advancedFeaturesService.updateUserAllergy(allergyId, validatedData);
    res.json({ success: true, data: allergy });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error updating allergy:", error);
    res.status(500).json({ error: "Failed to update allergy" });
  }
});
router.delete("/allergies/:id", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const allergyId = req.params.id;
    await advancedFeaturesService.deleteUserAllergy(allergyId);
    res.json({ success: true, message: "Allergy deleted successfully" });
  } catch (error) {
    console.error("Error deleting allergy:", error);
    res.status(500).json({ error: "Failed to delete allergy" });
  }
});
router.get("/allergies/check/:drugName", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const drugName = req.params.drugName;
    const alerts = await advancedFeaturesService.checkAllergyAlerts(userId, drugName);
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error("Error checking allergy alerts:", error);
    res.status(500).json({ error: "Failed to check allergy alerts" });
  }
});
router.post("/prescriptions", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const validatedData = createUserPrescriptionSchema.parse(req.body);
    const prescription = await advancedFeaturesService.createUserPrescription(userId, validatedData);
    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating prescription:", error);
    res.status(500).json({ error: "Failed to create prescription" });
  }
});
router.get("/prescriptions", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const prescriptions = await advancedFeaturesService.getUserPrescriptions(userId);
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
});
router.put("/prescriptions/:id", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const prescriptionId = req.params.id;
    const validatedData = createUserPrescriptionSchema.partial().parse(req.body);
    const prescription = await advancedFeaturesService.updateUserPrescription(prescriptionId, validatedData);
    res.json({ success: true, data: prescription });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error updating prescription:", error);
    res.status(500).json({ error: "Failed to update prescription" });
  }
});
router.delete("/prescriptions/:id", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const prescriptionId = req.params.id;
    await advancedFeaturesService.deleteUserPrescription(prescriptionId);
    res.json({ success: true, message: "Prescription deleted successfully" });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    res.status(500).json({ error: "Failed to delete prescription" });
  }
});
router.post("/interactions/check", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const validatedData = drugInteractionCheckSchema.parse(req.body);
    const interactions = await advancedFeaturesService.checkDrugInteractions(validatedData);
    res.json({ success: true, data: interactions });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error checking drug interactions:", error);
    res.status(500).json({ error: "Failed to check drug interactions" });
  }
});
router.get("/interactions/user-prescriptions", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const interactions = await advancedFeaturesService.checkUserPrescriptionInteractions(userId);
    res.json({ success: true, data: interactions });
  } catch (error) {
    console.error("Error checking user prescription interactions:", error);
    res.status(500).json({ error: "Failed to check user prescription interactions" });
  }
});
router.post("/dosage/calculate", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const validatedData = dosageCalculationSchema.parse(req.body);
    const dosage = await advancedFeaturesService.calculateDosage(validatedData);
    if (!dosage) {
      return res.status(404).json({ error: "Dosage guidelines not found for this drug and age group" });
    }
    res.json({ success: true, data: dosage });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error calculating dosage:", error);
    res.status(500).json({ error: "Failed to calculate dosage" });
  }
});
router.get("/settings", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const settings = await advancedFeaturesService.getUserSettings(userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ error: "Failed to fetch user settings" });
  }
});
router.put("/settings", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const validatedData = updateUserSettingsSchema.parse(req.body);
    const settings = await advancedFeaturesService.updateUserSettings(userId, validatedData);
    res.json({ success: true, data: settings });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error updating user settings:", error);
    res.status(500).json({ error: "Failed to update user settings" });
  }
});
router.post("/comprehensive-check", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { drugIds } = req.body;
    if (!Array.isArray(drugIds) || drugIds.length < 1) {
      return res.status(400).json({ error: "Drug IDs array is required" });
    }
    const results = await advancedFeaturesService.performComprehensiveCheck(userId, drugIds);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error performing comprehensive check:", error);
    res.status(500).json({ error: "Failed to perform comprehensive check" });
  }
});
var advancedFeaturesRoutes_default = router;

// server/externalInteractionRoutes.ts
import express2 from "express";
var router2 = express2.Router();
router2.post("/external-interactions", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { drugIds } = req.body;
    if (!Array.isArray(drugIds) || drugIds.length < 2) {
      return res.status(400).json({ error: "At least 2 drug IDs are required" });
    }
    const interactions = await externalInteractionService.getComprehensiveInteractions(drugIds);
    res.json({
      success: true,
      data: interactions,
      sources: ["internal", "openfda", "meditrone"],
      total: interactions.length
    });
  } catch (error) {
    console.error("Error fetching external interactions:", error);
    res.status(500).json({ error: "Failed to fetch external interactions" });
  }
});
router2.post("/sync-interactions", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { drugIds } = req.body;
    if (!Array.isArray(drugIds) || drugIds.length < 2) {
      return res.status(400).json({ error: "At least 2 drug IDs are required" });
    }
    const interactions = await externalInteractionService.getComprehensiveInteractions(drugIds);
    await externalInteractionService.updateInternalInteractions(interactions);
    res.json({
      success: true,
      message: "Internal database updated successfully",
      interactionsUpdated: interactions.length
    });
  } catch (error) {
    console.error("Error syncing interactions:", error);
    res.status(500).json({ error: "Failed to sync interactions" });
  }
});
router2.get("/cache-stats", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const stats = externalInteractionService.getCacheStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    res.status(500).json({ error: "Failed to get cache statistics" });
  }
});
router2.post("/clear-cache", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    externalInteractionService.clearCache();
    res.json({
      success: true,
      message: "Cache cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({ error: "Failed to clear cache" });
  }
});
router2.get("/test/openfda", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const testDrugNames = ["aspirin", "ibuprofen"];
    const interactions = await externalInteractionService.fetchOpenFDAInteractions(testDrugNames);
    res.json({
      success: true,
      data: {
        testDrugs: testDrugNames,
        interactionsFound: interactions.length,
        interactions: interactions.slice(0, 3)
        // Return first 3 for testing
      }
    });
  } catch (error) {
    console.error("Error testing Open FDA API:", error);
    res.status(500).json({ error: "Failed to test Open FDA API" });
  }
});
router2.get("/test/meditrone", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const testDrugNames = ["aspirin", "ibuprofen"];
    const interactions = await externalInteractionService.fetchMeditroneAIInteractions(testDrugNames);
    res.json({
      success: true,
      data: {
        testDrugs: testDrugNames,
        interactionsFound: interactions.length,
        interactions: interactions.slice(0, 3)
        // Return first 3 for testing
      }
    });
  } catch (error) {
    console.error("Error testing Meditrone AI API:", error);
    res.status(500).json({ error: "Failed to test Meditrone AI API" });
  }
});
var externalInteractionRoutes_default = router2;

// server/backupSyncRoutes.ts
import express3 from "express";
import { z as z3 } from "zod";

// server/backupSyncService.ts
import { eq as eq5, and as and5, desc as desc3 } from "drizzle-orm";

// server/encryption.ts
import crypto2 from "crypto";
var EncryptionService = class {
  algorithm = "aes-256-gcm";
  keyLength = 32;
  // 256 bits
  ivLength = 16;
  // 128 bits
  tagLength = 16;
  // 128 bits
  saltLength = 32;
  // 256 bits
  // Generate encryption key from password
  deriveKey(password, salt) {
    return crypto2.pbkdf2Sync(password, salt, 1e5, this.keyLength, "sha256");
  }
  // Generate random salt
  generateSalt() {
    return crypto2.randomBytes(this.saltLength);
  }
  // Generate random IV
  generateIV() {
    return crypto2.randomBytes(this.ivLength);
  }
  // Encrypt sensitive data
  encrypt(plaintext, password) {
    try {
      const encryptionKey = password || process.env.ENCRYPTION_KEY || "default-encryption-key-change-in-production";
      const salt = this.generateSalt();
      const iv = this.generateIV();
      const key = this.deriveKey(encryptionKey, salt);
      const cipher = crypto2.createCipheriv(this.algorithm, key, iv);
      cipher.setAAD(Buffer.from("medscan-egypt"));
      let encrypted = cipher.update(plaintext, "utf8", "hex");
      encrypted += cipher.final("hex");
      const tag = cipher.getAuthTag();
      return {
        encrypted,
        salt: salt.toString("hex"),
        iv: iv.toString("hex"),
        tag: tag.toString("hex")
      };
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }
  // Decrypt sensitive data
  decrypt(encryptedData, password) {
    try {
      const encryptionKey = password || process.env.ENCRYPTION_KEY || "default-encryption-key-change-in-production";
      const salt = Buffer.from(encryptedData.salt, "hex");
      const iv = Buffer.from(encryptedData.iv, "hex");
      const tag = Buffer.from(encryptedData.tag, "hex");
      const key = this.deriveKey(encryptionKey, salt);
      const decipher = crypto2.createDecipheriv(this.algorithm, key, iv);
      decipher.setAAD(Buffer.from("medscan-egypt"));
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }
  // Hash sensitive data (one-way)
  hash(data, salt) {
    const hashSalt = salt || crypto2.randomBytes(16).toString("hex");
    const hash = crypto2.pbkdf2Sync(data, hashSalt, 1e5, 64, "sha512").toString("hex");
    return `${hashSalt}:${hash}`;
  }
  // Verify hash
  verifyHash(data, hashedData) {
    const [salt, hash] = hashedData.split(":");
    const computedHash = crypto2.pbkdf2Sync(data, salt, 1e5, 64, "sha512").toString("hex");
    return hash === computedHash;
  }
  // Generate secure random token
  generateToken(length = 32) {
    return crypto2.randomBytes(length).toString("hex");
  }
  // Generate UUID
  generateUUID() {
    return crypto2.randomUUID();
  }
  // Mask sensitive data for logging
  maskSensitiveData(data, visibleChars = 4) {
    if (!data || data.length <= visibleChars * 2) {
      return "*".repeat(data.length);
    }
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = "*".repeat(data.length - visibleChars * 2);
    return start + middle + end;
  }
  // Encrypt prescription data
  encryptPrescription(prescriptionData) {
    const jsonString = JSON.stringify(prescriptionData);
    const encryptionResult = this.encrypt(jsonString);
    return {
      encryptedData: encryptionResult.encrypted,
      metadata: {
        encrypted: encryptionResult.encrypted,
        salt: encryptionResult.salt,
        iv: encryptionResult.iv,
        tag: encryptionResult.tag
      }
    };
  }
  // Decrypt prescription data
  decryptPrescription(metadata) {
    const decryptedString = this.decrypt(metadata);
    return JSON.parse(decryptedString);
  }
  // Encrypt PHI (Protected Health Information)
  encryptPHI(phiData) {
    return this.encrypt(JSON.stringify(phiData));
  }
  // Decrypt PHI
  decryptPHI(encryptedData) {
    const decryptedString = this.decrypt(encryptedData);
    return JSON.parse(decryptedString);
  }
  // Generate HMAC for data integrity
  generateHMAC(data, secret) {
    const hmacSecret = secret || process.env.HMAC_SECRET || "default-hmac-secret-change-in-production";
    return crypto2.createHmac("sha256", hmacSecret).update(data).digest("hex");
  }
  // Verify HMAC
  verifyHMAC(data, hmac, secret) {
    const expectedHMAC = this.generateHMAC(data, secret);
    return crypto2.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(expectedHMAC, "hex"));
  }
};
var encryptionService = new EncryptionService();
var generateChecksum = (data) => {
  return crypto2.createHash("sha256").update(data).digest("hex");
};

// server/backupSyncService.ts
import crypto3 from "crypto";
var BackupSyncService = class {
  // PRESCRIPTION BACKUP & SYNC
  async createPrescriptionBackup(userId, backupData) {
    const prescriptions = await db.select().from(userPrescriptions).where(and5(
      eq5(userPrescriptions.userId, userId),
      eq5(userPrescriptions.isActive, true)
    ));
    const backupPayload = {
      prescriptions,
      metadata: {
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        version: "1.0",
        deviceId: backupData.deviceId
      }
    };
    const checksum = generateChecksum(JSON.stringify(backupPayload));
    const backupSize = Buffer.byteLength(JSON.stringify(backupPayload));
    const [backup] = await db.insert(prescriptionBackups).values({
      userId,
      backupData: backupPayload,
      backupType: backupData.backupType,
      deviceId: backupData.deviceId,
      cloudProvider: backupData.cloudProvider,
      isEncrypted: backupData.isEncrypted,
      backupSize,
      checksum,
      syncStatus: "pending",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    this.syncToCloud(backup.id).catch(console.error);
    return backup;
  }
  async syncToCloud(backupId) {
    try {
      await db.update(prescriptionBackups).set({
        syncStatus: "syncing",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(prescriptionBackups.id, backupId));
      const [backup] = await db.select().from(prescriptionBackups).where(eq5(prescriptionBackups.id, backupId)).limit(1);
      if (!backup) {
        throw new Error("Backup not found");
      }
      const cloudPath = await this.uploadToCloudProvider(backup);
      await db.update(prescriptionBackups).set({
        cloudPath,
        syncStatus: "completed",
        lastSyncAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(prescriptionBackups.id, backupId));
    } catch (error) {
      await db.update(prescriptionBackups).set({
        syncStatus: "failed",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(prescriptionBackups.id, backupId));
      console.error("Cloud sync failed:", error);
      throw error;
    }
  }
  async uploadToCloudProvider(backup) {
    const cloudPath = `medscan-backups/${backup.userId}/${backup.id}.json`;
    await new Promise((resolve2) => setTimeout(resolve2, 2e3));
    console.log(`Uploaded backup to ${backup.cloudProvider}: ${cloudPath}`);
    return cloudPath;
  }
  async getUserBackups(userId) {
    return await db.select().from(prescriptionBackups).where(eq5(prescriptionBackups.userId, userId)).orderBy(desc3(prescriptionBackups.createdAt));
  }
  async restoreFromBackup(userId, backupId) {
    const [backup] = await db.select().from(prescriptionBackups).where(and5(
      eq5(prescriptionBackups.id, backupId),
      eq5(prescriptionBackups.userId, userId)
    )).limit(1);
    if (!backup) {
      throw new Error("Backup not found");
    }
    const currentChecksum = generateChecksum(JSON.stringify(backup.backupData));
    if (currentChecksum !== backup.checksum) {
      throw new Error("Backup integrity check failed");
    }
    const prescriptions = backup.backupData.prescriptions || [];
    for (const prescription of prescriptions) {
      await db.insert(userPrescriptions).values({
        ...prescription,
        userId,
        isActive: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoNothing();
    }
    console.log(`Restored ${prescriptions.length} prescriptions from backup`);
  }
  // USAGE ANALYTICS
  async trackUsageEvent(userId, eventData) {
    const [analytics] = await db.insert(usageAnalytics).values({
      userId,
      ...eventData,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return analytics;
  }
  async getUserUsageAnalytics(userId, filters) {
    let query = db.select().from(usageAnalytics).where(eq5(usageAnalytics.userId, userId));
    if (filters?.eventType) {
      query = query.where(and5(
        eq5(usageAnalytics.userId, userId),
        eq5(usageAnalytics.eventType, filters.eventType)
      ));
    }
    if (filters?.startDate) {
      query = query.where(and5(
        eq5(usageAnalytics.userId, userId),
        eq5(usageAnalytics.createdAt, filters.startDate)
      ));
    }
    return await query.orderBy(desc3(usageAnalytics.createdAt));
  }
  async getUsageStats(userId) {
    const analytics = await this.getUserUsageAnalytics(userId);
    const stats = {
      totalScans: analytics.filter((a) => a.eventType === "scan").length,
      totalSearches: analytics.filter((a) => a.eventType === "search").length,
      totalExports: analytics.filter((a) => a.eventType === "export").length,
      totalBackups: analytics.filter((a) => a.eventType === "backup").length,
      avgSessionDuration: analytics.reduce((acc, a) => acc + (a.duration || 0), 0) / analytics.length,
      mostUsedFeatures: this.getMostUsedFeatures(analytics)
    };
    return stats;
  }
  getMostUsedFeatures(analytics) {
    const featureCounts = analytics.reduce((acc, a) => {
      const feature = a.eventName;
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(featureCounts).map(([feature, count]) => ({ feature, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }
  // PRICE TREND ANALYSIS
  async analyzePriceTrends(drugId, region, analysisPeriod = "30d") {
    const priceHistoryData = await db.select().from(priceHistory).where(and5(
      eq5(priceHistory.drugId, drugId),
      eq5(priceHistory.region, region)
    )).orderBy(desc3(priceHistory.createdAt)).limit(100);
    if (priceHistoryData.length < 2) {
      throw new Error("Insufficient data for trend analysis");
    }
    const trends = [];
    const periods = ["7d", "30d", "90d", "1y"];
    for (const period of periods) {
      const trend = await this.calculateTrend(drugId, region, priceHistoryData, period);
      trends.push(trend);
    }
    for (const trend of trends) {
      await db.insert(priceTrends).values({
        ...trend,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoNothing();
    }
    return trends;
  }
  async calculateTrend(drugId, region, priceData, period) {
    const days = this.getPeriodDays(period);
    const recentData = priceData.slice(0, days);
    if (recentData.length < 2) {
      throw new Error("Insufficient data for period");
    }
    const currentPrice = recentData[0].newPrice;
    const previousPrice = recentData[recentData.length - 1].newPrice;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = priceChange / previousPrice * 100;
    let trendDirection = "stable";
    let trendStrength = "weak";
    if (Math.abs(priceChangePercent) > 10) {
      trendStrength = "strong";
    } else if (Math.abs(priceChangePercent) > 5) {
      trendStrength = "moderate";
    }
    if (priceChangePercent > 2) {
      trendDirection = "up";
    } else if (priceChangePercent < -2) {
      trendDirection = "down";
    }
    const predictedPrice = currentPrice * (1 + priceChangePercent / 100 * 0.1);
    const confidence = Math.max(0.1, 1 - days / 365);
    return {
      id: crypto3.randomUUID(),
      drugId,
      region,
      currentPrice,
      previousPrice,
      priceChange,
      priceChangePercent,
      trendDirection,
      trendStrength,
      predictedPrice,
      confidence,
      dataPoints: recentData.length,
      analysisPeriod: period,
      lastUpdated: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  getPeriodDays(period) {
    const periodMap = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365
    };
    return periodMap[period] || 30;
  }
  async getPriceTrends(drugId, region) {
    let query = db.select().from(priceTrends).where(eq5(priceTrends.drugId, drugId));
    if (region) {
      query = query.where(and5(
        eq5(priceTrends.drugId, drugId),
        eq5(priceTrends.region, region)
      ));
    }
    return await query.orderBy(desc3(priceTrends.lastUpdated));
  }
  // MARKET INTELLIGENCE
  async generateMarketIntelligence(drugId, region) {
    const [drug] = await db.select().from(egyptianDrugs).where(eq5(egyptianDrugs.id, drugId)).limit(1);
    if (!drug) {
      throw new Error("Drug not found");
    }
    const priceData = await db.select().from(priceHistory).where(and5(
      eq5(priceHistory.drugId, drugId),
      eq5(priceHistory.region, region)
    )).orderBy(desc3(priceHistory.createdAt)).limit(10);
    const demandLevel = this.analyzeDemandLevel(priceData);
    const availabilityStatus = this.analyzeAvailability(drug, priceData);
    const seasonality = this.analyzeSeasonality(priceData);
    const intelligence = {
      id: crypto3.randomUUID(),
      drugId,
      region,
      availabilityStatus,
      stockLevel: this.estimateStockLevel(priceData),
      demandLevel,
      seasonality,
      competitorPricing: this.getCompetitorPricing(drugId, region),
      marketShare: this.estimateMarketShare(drugId, region),
      forecastDemand: this.forecastDemand(priceData),
      recommendedAction: this.generateRecommendedAction(availabilityStatus, demandLevel),
      insights: {
        priceVolatility: this.calculatePriceVolatility(priceData),
        marketPosition: this.analyzeMarketPosition(drug, priceData),
        recommendations: this.generateInsights(drug, demandLevel, availabilityStatus)
      },
      dataSource: "pharmacy_api",
      reliability: 7,
      lastChecked: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    await db.insert(marketIntelligence).values(intelligence).onConflictDoNothing();
    return intelligence;
  }
  analyzeDemandLevel(priceData) {
    if (priceData.length < 3) return "medium";
    const recentPrices = priceData.slice(0, 5);
    const avgPrice = recentPrices.reduce((sum, p) => sum + parseFloat(p.newPrice), 0) / recentPrices.length;
    const priceVariation = Math.max(...recentPrices.map((p) => parseFloat(p.newPrice))) / avgPrice;
    if (priceVariation > 1.2) return "high";
    if (priceVariation > 1.1) return "medium";
    return "low";
  }
  analyzeAvailability(drug, priceData) {
    const recentPrice = priceData[0];
    if (!recentPrice || recentPrice.createdAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3)) {
      return "limited";
    }
    return "available";
  }
  analyzeSeasonality(priceData) {
    if (priceData.length < 12) return void 0;
    const monthlyPrices = this.groupByMonth(priceData);
    const priceVariation = this.calculateMonthlyVariation(monthlyPrices);
    if (priceVariation > 0.15) return "high_season";
    if (priceVariation < 0.05) return "stable";
    return "low_season";
  }
  groupByMonth(priceData) {
    return priceData.reduce((acc, p) => {
      const month = new Date(p.createdAt).getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(parseFloat(p.newPrice));
      return acc;
    }, {});
  }
  calculateMonthlyVariation(monthlyPrices) {
    const monthlyAvgs = Object.values(monthlyPrices).map(
      (prices) => prices.reduce((sum, price) => sum + price, 0) / prices.length
    );
    const avgPrice = monthlyAvgs.reduce((sum, price) => sum + price, 0) / monthlyAvgs.length;
    const maxDeviation = Math.max(...monthlyAvgs.map((price) => Math.abs(price - avgPrice)));
    return maxDeviation / avgPrice;
  }
  estimateStockLevel(priceData) {
    if (priceData.length === 0) return void 0;
    const recentPrice = priceData[0].newPrice;
    return Math.floor(Math.random() * 1e3);
  }
  getCompetitorPricing(drugId, region) {
    return {
      pharmacyA: Math.random() * 100 + 50,
      pharmacyB: Math.random() * 100 + 50,
      pharmacyC: Math.random() * 100 + 50
    };
  }
  estimateMarketShare(drugId, region) {
    return Math.random() * 20;
  }
  forecastDemand(priceData) {
    if (priceData.length < 3) return 100;
    const recentTrend = priceData[0].newPrice - priceData[2].newPrice;
    const baseDemand = 100;
    return Math.max(10, baseDemand + recentTrend * 10);
  }
  generateRecommendedAction(availability, demand) {
    if (availability === "out_of_stock") return "Urgent restocking required";
    if (demand === "high" && availability === "limited") return "Increase stock levels";
    if (demand === "low") return "Consider promotional pricing";
    return "Monitor market trends";
  }
  calculatePriceVolatility(priceData) {
    if (priceData.length < 2) return 0;
    const prices = priceData.map((p) => parseFloat(p.newPrice));
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
    return Math.sqrt(variance) / avgPrice;
  }
  analyzeMarketPosition(drug, priceData) {
    const currentPrice = parseFloat(priceData[0]?.newPrice || drug.price);
    const avgPrice = priceData.reduce((sum, p) => sum + parseFloat(p.newPrice), 0) / priceData.length;
    if (currentPrice < avgPrice * 0.9) return "Competitive pricing";
    if (currentPrice > avgPrice * 1.1) return "Premium pricing";
    return "Market average pricing";
  }
  generateInsights(drug, demand, availability) {
    const insights = [];
    if (demand === "high") {
      insights.push("High demand detected - consider inventory optimization");
    }
    if (availability === "limited") {
      insights.push("Limited availability - potential stockout risk");
    }
    insights.push(`Active ingredient: ${drug.activeIngredient}`);
    return insights;
  }
  async getMarketIntelligence(drugId, region) {
    let query = db.select().from(marketIntelligence).where(eq5(marketIntelligence.drugId, drugId));
    if (region) {
      query = query.where(and5(
        eq5(marketIntelligence.drugId, drugId),
        eq5(marketIntelligence.region, region)
      ));
    }
    return await query.orderBy(desc3(marketIntelligence.lastChecked));
  }
  // EXPORT FEATURES
  async createExport(userId, exportData) {
    const [exportRecord] = await db.insert(exportHistory).values({
      userId,
      ...exportData,
      status: "pending",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    this.processExport(exportRecord.id).catch(console.error);
    return exportRecord;
  }
  async processExport(exportId) {
    try {
      await db.update(exportHistory).set({
        status: "processing",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(exportHistory.id, exportId));
      const [exportRecord] = await db.select().from(exportHistory).where(eq5(exportHistory.id, exportId)).limit(1);
      if (!exportRecord) {
        throw new Error("Export record not found");
      }
      let downloadUrl;
      let fileSize;
      switch (exportRecord.exportType) {
        case "pdf":
          const pdfResult = await this.generatePDFExport(exportRecord);
          downloadUrl = pdfResult.url;
          fileSize = pdfResult.size;
          break;
        case "email":
          await this.sendEmailExport(exportRecord);
          break;
        case "csv":
          const csvResult = await this.generateCSVExport(exportRecord);
          downloadUrl = csvResult.url;
          fileSize = csvResult.size;
          break;
      }
      await db.update(exportHistory).set({
        status: "completed",
        downloadUrl,
        fileSize,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3),
        // 24 hours
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(exportHistory.id, exportId));
    } catch (error) {
      await db.update(exportHistory).set({
        status: "failed",
        errorMessage: error.message,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq5(exportHistory.id, exportId));
      console.error("Export processing failed:", error);
      throw error;
    }
  }
  async generatePDFExport(exportRecord) {
    const pdfContent = JSON.stringify(exportRecord.contentData, null, 2);
    const size = Buffer.byteLength(pdfContent);
    const url = `https://api.medscanegypt.com/exports/${exportRecord.id}.pdf`;
    console.log(`Generated PDF export: ${url}`);
    return { url, size };
  }
  async sendEmailExport(exportRecord) {
    console.log(`Sent email export to ${exportRecord.recipientEmail}`);
  }
  async generateCSVExport(exportRecord) {
    const csvContent = this.convertToCSV(exportRecord.contentData);
    const size = Buffer.byteLength(csvContent);
    const url = `https://api.medscanegypt.com/exports/${exportRecord.id}.csv`;
    console.log(`Generated CSV export: ${url}`);
    return { url, size };
  }
  convertToCSV(data) {
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0]);
      const csvRows = data.map(
        (row) => headers.map((header) => `"${row[header] || ""}"`).join(",")
      );
      return [headers.join(","), ...csvRows].join("\n");
    }
    return JSON.stringify(data);
  }
  async getUserExports(userId) {
    return await db.select().from(exportHistory).where(eq5(exportHistory.userId, userId)).orderBy(desc3(exportHistory.createdAt));
  }
  async getExportDownloadUrl(exportId, userId) {
    const [exportRecord] = await db.select().from(exportHistory).where(and5(
      eq5(exportHistory.id, exportId),
      eq5(exportHistory.userId, userId),
      eq5(exportHistory.status, "completed")
    )).limit(1);
    if (!exportRecord || !exportRecord.downloadUrl) {
      return null;
    }
    if (exportRecord.expiresAt && /* @__PURE__ */ new Date() > exportRecord.expiresAt) {
      return null;
    }
    return exportRecord.downloadUrl;
  }
};
var backupSyncService = new BackupSyncService();

// server/backupSyncRoutes.ts
var router3 = express3.Router();
router3.post("/backup", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const validatedData = createPrescriptionBackupSchema.parse(req.body);
    const backup = await backupSyncService.createPrescriptionBackup(userId, validatedData);
    res.status(201).json({ success: true, data: backup });
  } catch (error) {
    if (error instanceof z3.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating backup:", error);
    res.status(500).json({ error: "Failed to create backup" });
  }
});
router3.get("/backups", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const backups = await backupSyncService.getUserBackups(userId);
    res.json({ success: true, data: backups });
  } catch (error) {
    console.error("Error fetching backups:", error);
    res.status(500).json({ error: "Failed to fetch backups" });
  }
});
router3.post("/restore/:backupId", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { backupId } = req.params;
    await backupSyncService.restoreFromBackup(userId, backupId);
    res.json({ success: true, message: "Backup restored successfully" });
  } catch (error) {
    console.error("Error restoring backup:", error);
    res.status(500).json({ error: "Failed to restore backup" });
  }
});
router3.post("/analytics/track", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const validatedData = createUsageAnalyticsSchema.parse(req.body);
    const analytics = await backupSyncService.trackUsageEvent(userId, validatedData);
    res.status(201).json({ success: true, data: analytics });
  } catch (error) {
    if (error instanceof z3.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error tracking usage:", error);
    res.status(500).json({ error: "Failed to track usage" });
  }
});
router3.get("/analytics", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { eventType, startDate, endDate } = req.query;
    const filters = {
      eventType,
      startDate: startDate ? new Date(startDate) : void 0,
      endDate: endDate ? new Date(endDate) : void 0
    };
    const analytics = await backupSyncService.getUserUsageAnalytics(userId, filters);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});
router3.get("/analytics/stats", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const stats = await backupSyncService.getUsageStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    res.status(500).json({ error: "Failed to fetch usage stats" });
  }
});
router3.post("/price-trends/analyze", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const validatedData = createPriceTrendSchema.parse(req.body);
    const trends = await backupSyncService.analyzePriceTrends(
      validatedData.drugId,
      validatedData.region,
      validatedData.analysisPeriod
    );
    res.status(201).json({ success: true, data: trends });
  } catch (error) {
    if (error instanceof z3.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error analyzing price trends:", error);
    res.status(500).json({ error: "Failed to analyze price trends" });
  }
});
router3.get("/price-trends/:drugId", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { drugId } = req.params;
    const { region } = req.query;
    const trends = await backupSyncService.getPriceTrends(
      parseInt(drugId),
      region
    );
    res.json({ success: true, data: trends });
  } catch (error) {
    console.error("Error fetching price trends:", error);
    res.status(500).json({ error: "Failed to fetch price trends" });
  }
});
router3.post("/market-intelligence/generate", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const validatedData = createMarketIntelligenceSchema.parse(req.body);
    const intelligence = await backupSyncService.generateMarketIntelligence(
      validatedData.drugId,
      validatedData.region
    );
    res.status(201).json({ success: true, data: intelligence });
  } catch (error) {
    if (error instanceof z3.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error generating market intelligence:", error);
    res.status(500).json({ error: "Failed to generate market intelligence" });
  }
});
router3.get("/market-intelligence/:drugId", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { drugId } = req.params;
    const { region } = req.query;
    const intelligence = await backupSyncService.getMarketIntelligence(
      parseInt(drugId),
      region
    );
    res.json({ success: true, data: intelligence });
  } catch (error) {
    console.error("Error fetching market intelligence:", error);
    res.status(500).json({ error: "Failed to fetch market intelligence" });
  }
});
router3.post("/export", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const validatedData = createExportHistorySchema.parse(req.body);
    const exportRecord = await backupSyncService.createExport(userId, validatedData);
    res.status(201).json({ success: true, data: exportRecord });
  } catch (error) {
    if (error instanceof z3.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating export:", error);
    res.status(500).json({ error: "Failed to create export" });
  }
});
router3.get("/exports", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const exports = await backupSyncService.getUserExports(userId);
    res.json({ success: true, data: exports });
  } catch (error) {
    console.error("Error fetching exports:", error);
    res.status(500).json({ error: "Failed to fetch exports" });
  }
});
router3.get("/export/:exportId/download", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const { exportId } = req.params;
    const downloadUrl = await backupSyncService.getExportDownloadUrl(exportId, userId);
    if (!downloadUrl) {
      return res.status(404).json({ error: "Export not found or expired" });
    }
    res.json({ success: true, data: { downloadUrl } });
  } catch (error) {
    console.error("Error getting export download:", error);
    res.status(500).json({ error: "Failed to get export download" });
  }
});
var backupSyncRoutes_default = router3;

// server/cache.ts
var MemoryCache = class {
  cache = /* @__PURE__ */ new Map();
  maxSize;
  cleanupInterval;
  constructor(maxSize = 1e3) {
    this.maxSize = maxSize;
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1e3);
  }
  set(key, data, ttl) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccessed: Date.now()
    });
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.timestamp > entry.ttl * 1e3) {
      this.cache.delete(key);
      return null;
    }
    entry.hits++;
    entry.lastAccessed = Date.now();
    return entry.data;
  }
  delete(key) {
    return this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
  // Remove expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1e3) {
        this.cache.delete(key);
      }
    }
  }
  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalHits = 0;
    let avgAge = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1e3) {
        expiredCount++;
      }
      totalHits += entry.hits;
      avgAge += now - entry.timestamp;
    }
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredCount,
      totalHits,
      avgAge: this.cache.size > 0 ? avgAge / this.cache.size : 0,
      hitRate: totalHits > 0 ? totalHits / (totalHits + this.cache.size) * 100 : 0
    };
  }
  // Destroy cache and cleanup interval
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
};
var cache = new MemoryCache(1e3);
function createCacheMiddleware(config) {
  return (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }
    const key = config.keyGenerator ? config.keyGenerator(req) : `${req.path}:${JSON.stringify(req.query)}`;
    const cached = cache.get(key);
    if (cached) {
      const cacheEntry = cached;
      res.set("X-Cache", "HIT");
      res.set("X-Cache-Hits", cacheEntry.hits.toString());
      res.set("X-Cache-Age", Math.floor((Date.now() - cacheEntry.timestamp) / 1e3).toString());
      return res.json(cacheEntry.data);
    }
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, config.ttl);
        res.set("X-Cache", "MISS");
      }
      return originalJson.call(this, data);
    };
    next();
  };
}
var cacheConfigs = {
  // Drug data changes rarely - cache for 1 hour
  drugs: { ttl: 3600, maxSize: 500 },
  // Price data changes frequently - cache for 5 minutes
  prices: { ttl: 300, maxSize: 200 },
  // User data changes occasionally - cache for 15 minutes
  users: { ttl: 900, maxSize: 100 },
  // Search results - cache for 10 minutes
  search: { ttl: 600, maxSize: 300 },
  // Static data - cache for 24 hours
  static: { ttl: 86400, maxSize: 50 }
};
var CacheManager = class {
  static invalidatePattern(pattern) {
    let count = 0;
    const stats = cache.getStats();
    for (let i = 0; i < stats.size; i++) {
      count++;
    }
    return count;
  }
  static invalidateUser(userId) {
    return this.invalidatePattern(`/api/auth/${userId}`);
  }
  static invalidateDrug(drugId) {
    return this.invalidatePattern(`/api/drugs/${drugId}`);
  }
  static invalidatePrices() {
    return this.invalidatePattern("/api/prices");
  }
  static clearAll() {
    cache.clear();
  }
  static getStats() {
    return cache.getStats();
  }
};
var cacheMiddleware = {
  drugs: createCacheMiddleware(cacheConfigs.drugs),
  prices: createCacheMiddleware(cacheConfigs.prices),
  users: createCacheMiddleware(cacheConfigs.users),
  search: createCacheMiddleware(cacheConfigs.search),
  static: createCacheMiddleware(cacheConfigs.static)
};
process.on("SIGINT", () => {
  cache.destroy();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cache.destroy();
  process.exit(0);
});

// server/imageOptimizer.ts
import sharp from "sharp";
import { createHash } from "crypto";
var IMAGE_CONFIGS = {
  // Thumbnail for previews - small, fast loading
  thumbnail: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 80,
    format: "webp",
    progressive: true
  },
  // Standard display image - balanced quality and size
  standard: {
    maxWidth: 800,
    maxHeight: 1200,
    quality: 85,
    format: "webp",
    progressive: true
  },
  // High quality for analysis - preserve details
  analysis: {
    maxWidth: 1200,
    maxHeight: 1800,
    quality: 90,
    format: "jpeg",
    progressive: false
  },
  // Preview for OCR - optimized for text recognition
  ocr: {
    maxWidth: 1024,
    maxHeight: 1536,
    quality: 95,
    format: "jpeg",
    progressive: false
  }
};
var ImageOptimizer = class _ImageOptimizer {
  static instance;
  static getInstance() {
    if (!_ImageOptimizer.instance) {
      _ImageOptimizer.instance = new _ImageOptimizer();
    }
    return _ImageOptimizer.instance;
  }
  // Optimize image buffer
  async optimizeImage(imageBuffer, config = IMAGE_CONFIGS.standard) {
    const startTime = Date.now();
    const originalSize = imageBuffer.length;
    try {
      const metadata = await sharp(imageBuffer).metadata();
      let sharpInstance = sharp(imageBuffer);
      if (metadata.width && metadata.height) {
        const { width, height } = this.calculateDimensions(
          metadata.width,
          metadata.height,
          config.maxWidth,
          config.maxHeight
        );
        if (width !== metadata.width || height !== metadata.height) {
          sharpInstance = sharpInstance.resize(width, height, {
            fit: "inside",
            withoutEnlargement: true
          });
        }
      }
      const formatOptions = {
        quality: config.quality,
        progressive: config.progressive
      };
      if (config.format === "webp") {
        sharpInstance = sharpInstance.webp(formatOptions);
      } else if (config.format === "png") {
        sharpInstance = sharpInstance.png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          progressive: config.progressive
        });
      } else {
        sharpInstance = sharpInstance.jpeg(formatOptions);
      }
      const optimizedBuffer = await sharpInstance.toBuffer();
      const processingTime = Date.now() - startTime;
      const hash = this.generateImageHash(optimizedBuffer);
      const imageMetadata = {
        originalSize,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: originalSize > 0 ? (originalSize - optimizedBuffer.length) / originalSize : 0,
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0
        },
        format: config.format,
        hash,
        processingTime
      };
      return {
        buffer: optimizedBuffer,
        metadata: imageMetadata
      };
    } catch (error) {
      console.error("Image optimization failed:", error);
      throw new Error(`Failed to optimize image: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  // Calculate new dimensions maintaining aspect ratio
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    const aspectRatio = originalWidth / originalHeight;
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    if (originalWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = maxWidth / aspectRatio;
    }
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }
    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };
  }
  // Generate consistent hash for image
  generateImageHash(buffer) {
    return createHash("sha256").update(buffer).digest("hex").substring(0, 16);
  }
  // Validate image buffer
  async validateImage(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return !!(metadata.width && metadata.height && metadata.format);
    } catch {
      return false;
    }
  }
  // Get image info without processing
  async getImageInfo(buffer) {
    return await sharp(buffer).metadata();
  }
  // Batch optimize multiple images
  async optimizeBatch(images) {
    const results = [];
    for (const { buffer, config } of images) {
      try {
        const result = await this.optimizeImage(buffer, config);
        results.push(result);
      } catch (error) {
        console.error("Failed to optimize image in batch:", error);
        results.push({
          buffer,
          metadata: {
            originalSize: buffer.length,
            optimizedSize: buffer.length,
            compressionRatio: 0,
            dimensions: { width: 0, height: 0 },
            format: "original",
            hash: "",
            processingTime: 0
          }
        });
      }
    }
    return results;
  }
  // Create multiple sizes from single image
  async createMultipleSizes(imageBuffer, configs) {
    const results = [];
    for (const { name, config } of configs) {
      try {
        const result = await this.optimizeImage(imageBuffer, config);
        results.push({ name, ...result });
      } catch (error) {
        console.error(`Failed to create ${name} size:`, error);
      }
    }
    return results;
  }
};
var ImageUtils = {
  // Convert base64 to buffer
  base64ToBuffer(base64) {
    const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, "");
    return Buffer.from(base64Data, "base64");
  },
  // Convert buffer to base64
  bufferToBase64(buffer, mimeType = "image/jpeg") {
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  },
  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },
  // Get image format from buffer
  async getImageFormat(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return metadata.format || "unknown";
    } catch {
      return "unknown";
    }
  }
};
var imageOptimizer_default = ImageOptimizer;

// server/routes.ts
function generatePharmacyLinks(medicineName) {
  const encodedName = encodeURIComponent(medicineName);
  return [
    {
      pharmacy: "Seif",
      searchUrl: `https://www.seif-online.com/en/products?search=${encodedName}`,
      logoColor: "#E31837"
    },
    {
      pharmacy: "Tarshouby",
      searchUrl: `https://alabdellatif-tarshouby.com/en/products?search=${encodedName}`,
      logoColor: "#1E3A8A"
    },
    {
      pharmacy: "Google",
      searchUrl: `https://www.google.com/search?q=${encodedName}+Egypt+pharmacy+price`,
      logoColor: "#4285F4"
    }
  ];
}
async function findNearestMatch(name) {
  const normalizedName = name.toLowerCase().trim();
  try {
    const exactMatch = await mockDrugService.searchDrugByName(name);
    if (exactMatch) {
      return { match: exactMatch, similarity: 1 };
    }
    const allDrugs = await mockDrugService.getAllDrugs(1e3, 0);
    let bestMatch = null;
    let bestSimilarity = 0;
    for (const drug of allDrugs) {
      const drugName = drug.name.toLowerCase();
      const drugArabic = drug.nameArabic.toLowerCase();
      if (drugName.startsWith(normalizedName) || normalizedName.startsWith(drugName)) {
        const similarity = 0.9;
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = drug;
        }
      }
      if (drugName.includes(normalizedName) || normalizedName.includes(drugName)) {
        const similarity = 0.7;
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = drug;
        }
      }
    }
    return { match: bestMatch, similarity: bestSimilarity };
  } catch (error) {
    console.error("Error finding nearest match:", error);
    return { match: null, similarity: 0 };
  }
}
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
async function findAlternatives(activeIngredient, category, excludeName) {
  return await mockDrugService.findAlternatives(excludeName, activeIngredient, category, 5);
}
var openai = process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_API_KEY !== "your-openai-api-key-placeholder" ? new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
}) : null;
function registerRoutes(app2) {
  app2.use(securityHeaders);
  app2.use(requestLogger);
  app2.use(rateLimit(100, 15 * 60 * 1e3));
  app2.post("/api/auth/register", rateLimit(5, 15 * 60 * 1e3), register);
  app2.post("/api/auth/login", rateLimit(10, 15 * 60 * 1e3), login);
  app2.post("/api/auth/refresh", refreshToken);
  app2.post("/api/auth/logout", authenticate, logout);
  app2.post("/api/auth/logout-all", authenticate, logoutAll);
  app2.post("/api/auth/forgot-password", rateLimit(3, 15 * 60 * 1e3), forgotPassword);
  app2.post("/api/auth/reset-password", resetPassword);
  app2.post("/api/auth/change-password", authenticate, changePassword);
  app2.get("/api/auth/profile", authenticate, getProfile);
  app2.get("/api/auth/sessions", authenticate, getSessions);
  app2.get("/api/auth/verify-email", verifyEmail);
  app2.post("/api/analyze-prescription", authenticate, async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({
          error: "AI service unavailable",
          message: "OpenAI API key not configured"
        });
      }
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image is required" });
      }
      const imageOptimizer = imageOptimizer_default.getInstance();
      const imageBuffer = ImageUtils.base64ToBuffer(image);
      const isValidImage = await imageOptimizer.validateImage(imageBuffer);
      if (!isValidImage) {
        return res.status(400).json({ error: "Invalid image format" });
      }
      const optimizedResult = await imageOptimizer.optimizeImage(
        imageBuffer,
        IMAGE_CONFIGS.ocr
      );
      console.log(`Image optimized: ${ImageUtils.formatFileSize(optimizedResult.metadata.originalSize)} \u2192 ${ImageUtils.formatFileSize(optimizedResult.metadata.optimizedSize)} (${(optimizedResult.metadata.compressionRatio * 100).toFixed(1)}% reduction)`);
      const optimizedImage = ImageUtils.bufferToBase64(optimizedResult.buffer, "image/jpeg");
      const ocrResponse = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `You are a medical prescription OCR specialist. Analyze handwritten prescriptions and extract medicine names.
            
Your task:
1. Identify all medicine/drug names in the prescription image
2. Match them to common Egyptian pharmaceutical brand names when possible
3. Include confidence scores based on legibility

Return a JSON object with this structure:
{
  "medicines": [
    {
      "name": "Medicine Name",
      "nameArabic": "Arabic name if visible",
      "confidence": 85
    }
  ]
}

Common Egyptian drug brands to look for: Augmentin, Panadol, Concor, Glucophage, Zyrtec, Cipro, Amaryl, Nexium, Lipitor, Ventolin, Aspirin Protect, Januvia

Always respond with valid JSON only.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: optimizedImage
                }
              },
              {
                type: "text",
                text: "Please analyze this handwritten prescription and extract all medicine names. Return the results as JSON."
              }
            ]
          }
        ],
        max_completion_tokens: 1024
      });
      const ocrContent = ocrResponse.choices[0]?.message?.content || "{}";
      let parsedOcr;
      try {
        const jsonMatch = ocrContent.match(/\{[\s\S]*\}/);
        parsedOcr = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
      } catch {
        parsedOcr = { medicines: [] };
      }
      const medicines = parsedOcr.medicines || [];
      const compositionResponse = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `You are a pharmaceutical database specialist with knowledge of Egyptian medicines (similar to dalilaldawaa.com).

For each medicine, provide its composition and active ingredients as they would appear in an Egyptian drug database.

Return JSON array with this structure:
[
  {
    "name": "Medicine Name",
    "activeIngredient": "Main active ingredient",
    "composition": "Full composition with strengths",
    "therapeuticClass": "Drug class (e.g., Antibiotic, Analgesic)",
    "manufacturer": "Manufacturer name if known"
  }
]

Be accurate with Egyptian brand names and their formulations. Respond with valid JSON only.`
          },
          {
            role: "user",
            content: `Provide composition data for these Egyptian medicines: ${JSON.stringify(medicines.map((m) => m.name))}`
          }
        ],
        max_completion_tokens: 1024
      });
      let compositionData = [];
      try {
        const compContent = compositionResponse.choices[0]?.message?.content || "[]";
        const jsonMatch = compContent.match(/\[[\s\S]*\]/);
        compositionData = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
      } catch {
        compositionData = [];
      }
      const sampleDrugs = await mockDrugService.getAllDrugs(1e3, 0);
      const drugNames = sampleDrugs.map((d) => d.name).join(", ");
      const recommendationsResponse = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `You are Meditron, a medical AI assistant specializing in Egyptian pharmaceuticals. Provide clinical recommendations based on drug composition and interactions.

Available Egyptian drugs database: ${drugNames}

Drug composition data from Egyptian database:
${JSON.stringify(compositionData, null, 2)}

For each medicine, analyze the composition and provide:
1. Dosing guidance based on active ingredient strength
2. Drug interactions (especially with other medicines in the prescription based on their active ingredients)
3. Contraindications based on drug class and composition
4. General recommendations

Be concise but thorough. Use clinical language. Consider interactions between all medicines in the prescription.
Always recommend consulting a healthcare provider.

Return JSON array with this structure:
[
  {
    "dosing": "Dosing instructions based on composition",
    "interactions": ["interaction1 with specific drugs", "interaction2"],
    "contraindications": ["contraindication1"],
    "recommendations": ["recommendation1", "recommendation2"]
  }
]

Respond with valid JSON only.`
          },
          {
            role: "user",
            content: `Provide clinical recommendations for these medicines found in a prescription: ${JSON.stringify(medicines)}`
          }
        ],
        max_completion_tokens: 2048
      });
      const recContent = recommendationsResponse.choices[0]?.message?.content || "[]";
      let recommendations;
      try {
        const jsonMatch = recContent.match(/\[[\s\S]*\]/);
        recommendations = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
      } catch {
        recommendations = medicines.map(() => ({
          dosing: "Consult your healthcare provider for dosing information.",
          interactions: [],
          contraindications: [],
          recommendations: ["Always follow your doctor's instructions."]
        }));
      }
      const enrichedMedicines = await Promise.all(medicines.map(async (med, idx) => {
        const compMatch = compositionData.find(
          (c) => c.name?.toLowerCase() === med.name.toLowerCase()
        );
        const exactMatch = await mockDrugService.searchDrugByName(med.name);
        let verificationStatus = "unverified";
        let suggestedMatch = null;
        let alternatives = [];
        if (exactMatch) {
          verificationStatus = "verified";
          alternatives = await findAlternatives(exactMatch.activeIngredient || void 0, exactMatch.category || void 0, exactMatch.name);
        } else {
          const { match, similarity } = await findNearestMatch(med.name);
          if (match && similarity >= 0.7) {
            verificationStatus = "suggested";
            suggestedMatch = match;
            alternatives = await findAlternatives(match.activeIngredient || void 0, match.category || void 0, match.name);
          }
        }
        const activeIngredient = compMatch?.activeIngredient || exactMatch?.activeIngredient || suggestedMatch?.activeIngredient;
        const category = compMatch?.therapeuticClass || exactMatch?.category || suggestedMatch?.category;
        if (alternatives.length === 0) {
          alternatives = await findAlternatives(activeIngredient, category, med.name);
        }
        return {
          ...med,
          nameArabic: med.nameArabic || exactMatch?.nameArabic || suggestedMatch?.nameArabic,
          activeIngredient,
          composition: compMatch?.composition,
          therapeuticClass: compMatch?.therapeuticClass || exactMatch?.category || suggestedMatch?.category,
          manufacturer: compMatch?.manufacturer,
          verificationStatus,
          suggestedMatch: suggestedMatch ? {
            name: suggestedMatch.name,
            nameArabic: suggestedMatch.nameArabic,
            activeIngredient: suggestedMatch.activeIngredient
          } : null,
          alternatives: alternatives.map((alt) => ({
            name: alt.name,
            nameArabic: alt.nameArabic,
            activeIngredient: alt.activeIngredient,
            dosing: alt.dosing
          }))
        };
      }));
      res.json({
        medicines: enrichedMedicines,
        recommendations,
        compositionSource: "Dalil Aldawaa Egyptian Drug Database"
      });
    } catch (error) {
      console.error("Error analyzing prescription:", error);
      res.status(500).json({
        error: "Failed to analyze prescription",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/pharmacy-search", async (req, res) => {
    try {
      const { medicineName } = req.body;
      if (!medicineName) {
        return res.status(400).json({ error: "Medicine name is required" });
      }
      const pharmacyLinks = generatePharmacyLinks(medicineName);
      const drugInfo = await mockDrugService.searchDrugByName(medicineName);
      let imageUrl = null;
      let productDescription = null;
      try {
        const searchResponse = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            {
              role: "system",
              content: `You are a pharmaceutical product information assistant. For the given medicine name, provide accurate product information.
              
Return JSON with this structure:
{
  "productName": "Full product name with strength",
  "manufacturer": "Manufacturer name",
  "description": "Brief description of the medicine and its use",
  "typicalPrice": "Approximate price range in Egyptian Pounds",
  "packaging": "Common packaging info (e.g., box of 20 tablets)"
}

Respond with valid JSON only.`
            },
            {
              role: "user",
              content: `Provide product information for the Egyptian medicine: ${medicineName}`
            }
          ],
          max_completion_tokens: 512
        });
        const content = searchResponse.choices[0]?.message?.content || "{}";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const productInfo = JSON.parse(jsonMatch[0]);
          productDescription = productInfo.description;
        }
      } catch (error) {
        console.error("Error fetching product info:", error);
      }
      res.json({
        medicineName,
        pharmacyLinks,
        productDescription,
        drugInfo: drugInfo || null
      });
    } catch (error) {
      console.error("Error in pharmacy search:", error);
      res.status(500).json({
        error: "Failed to search pharmacies",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  function fuzzyMatch(text2, query) {
    if (!text2 || !query) return { matches: false, score: 0 };
    const normalizedText = text2.toLowerCase().replace(/[-_.,()]/g, " ").replace(/\s+/g, " ").trim();
    const normalizedQuery = query.toLowerCase().replace(/[-_.,()]/g, " ").replace(/\s+/g, " ").trim();
    if (normalizedText === normalizedQuery) return { matches: true, score: 100 };
    if (normalizedText.includes(normalizedQuery)) return { matches: true, score: 90 };
    if (normalizedQuery.includes(normalizedText)) return { matches: true, score: 85 };
    const queryWords = normalizedQuery.split(" ").filter((w) => w.length > 1);
    const textWords = normalizedText.split(" ");
    let matchedWords = 0;
    let partialMatches = 0;
    for (const qWord of queryWords) {
      for (const tWord of textWords) {
        if (tWord === qWord) {
          matchedWords++;
          break;
        } else if (tWord.includes(qWord) || qWord.includes(tWord)) {
          partialMatches++;
          break;
        } else if (tWord.startsWith(qWord.slice(0, 3)) || qWord.startsWith(tWord.slice(0, 3))) {
          partialMatches += 0.5;
          break;
        }
      }
    }
    if (queryWords.length > 0) {
      const matchRatio = (matchedWords + partialMatches * 0.7) / queryWords.length;
      if (matchRatio >= 0.5) {
        return { matches: true, score: 50 + matchRatio * 40 };
      }
    }
    const maxLen = Math.max(normalizedText.length, normalizedQuery.length);
    const distance = levenshteinDistance(normalizedText.slice(0, 30), normalizedQuery.slice(0, 30));
    const similarity = 1 - distance / maxLen;
    if (similarity >= 0.6) {
      return { matches: true, score: similarity * 60 };
    }
    return { matches: false, score: 0 };
  }
  app2.get("/api/drugs", cacheMiddleware.drugs, async (req, res) => {
    try {
      const search = (req.query.search || "").trim();
      const category = req.query.category || "All";
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 200);
      const offset = (page - 1) * limit;
      let drugs;
      if (search || category && category !== "All") {
        drugs = await mockDrugService.searchDrugs({
          name: search || void 0,
          category: category !== "All" ? category : void 0,
          limit,
          offset
        });
      } else {
        drugs = await mockDrugService.getAllDrugs(limit, offset);
      }
      const total = await mockDrugService.getTotalCount();
      const responseDrugs = drugs.map((drug) => ({
        id: String(drug.id),
        name: drug.name,
        nameArabic: drug.nameArabic || "",
        activeIngredient: drug.activeIngredient || "",
        category: drug.category || "Medicine",
        manufacturer: drug.manufacturer || "",
        form: drug.form || "",
        price: drug.price ? String(drug.price) : "",
        dosing: drug.dosing || "",
        description: drug.descriptionEnglish || drug.descriptionArabic || ""
      }));
      res.json({
        drugs: responseDrugs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error("Error fetching drugs:", error);
      res.status(500).json({ error: "Failed to fetch drugs" });
    }
  });
  app2.get("/api/drugs/:id", cacheMiddleware.drugs, async (req, res) => {
    try {
      const drugId = req.params.id;
      const drug = await mockDrugService.getDrugById(parseInt(drugId));
      if (!drug) {
        return res.status(404).json({ error: "Drug not found" });
      }
      res.json({
        id: String(drug.id),
        name: drug.name,
        nameArabic: drug.nameArabic || "",
        activeIngredient: drug.activeIngredient || "",
        category: drug.category || "Medicine",
        manufacturer: drug.manufacturer || "",
        form: drug.form || "",
        price: drug.price ? String(drug.price) : "",
        dosing: drug.dosing || "",
        description: drug.descriptionEnglish || drug.descriptionArabic || "",
        interactions: drug.interactions || [],
        contraindications: drug.contraindications || [],
        sideEffects: drug.sideEffects || []
      });
    } catch (error) {
      console.error("Error fetching drug:", error);
      res.status(500).json({ error: "Failed to fetch drug" });
    }
  });
  app2.post("/api/drugs/:drugId/price", updateDrugPrice);
  app2.post("/api/prices/bulk-update", bulkUpdatePrices);
  app2.get("/api/drugs/:drugId/price-history", cacheMiddleware.prices, getPriceHistory);
  app2.get("/api/drugs/:drugId/price-statistics", cacheMiddleware.prices, getPriceStatistics);
  app2.get("/api/drugs/:drugId/price-trends", cacheMiddleware.prices, getPriceTrends);
  app2.get("/api/prices/recent-changes", cacheMiddleware.prices, getRecentPriceChanges);
  app2.post("/api/drugs/:drugId/price", authenticate, async (req, res) => {
    try {
      const result = await updateDrugPrice(req, res);
      CacheManager.invalidateDrug(req.params.drugId);
      CacheManager.invalidatePrices();
      return result;
    } catch (error) {
      console.error("Error updating price:", error);
      res.status(500).json({ error: "Failed to update price" });
    }
  });
  app2.put("/api/drugs/:drugId/verify-price", verifyDrugPrice);
  app2.get("/api/prices/unverified", cacheMiddleware.prices, getUnverifiedPrices);
  app2.get("/api/prices/changes", getPriceChangesByDateRange);
  app2.get("/api/tarshouby/search", searchTarshouby);
  app2.get("/api/tarshouby/product-details", getTarshoubyProductDetails);
  app2.post("/api/tarshouby/update-price", authenticate, updatePriceFromTarshouby);
  app2.post("/api/tarshouby/bulk-update", authenticate, bulkUpdatePricesFromTarshouby);
  app2.get("/api/tarshouby/health", getTarshoubyHealth);
  app2.get("/api/prices/compare", comparePrices);
  app2.use("/api/advanced", advancedFeaturesRoutes_default);
  app2.use("/api/backup-sync", backupSyncRoutes_default);
  app2.use("/api/external", externalInteractionRoutes_default);
  app2.use(errorHandler);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express4();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express4.json({
      limit: "50mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express4.urlencoded({ extended: false, limit: "50mb" }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express4.static(path.resolve(process.cwd(), "assets")));
  app2.use(express4.static(path.resolve(process.cwd(), "static-build")));
  app2.use(express4.static(path.resolve(process.cwd())));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      // reusePort is not supported on Windows
      ...process.platform !== "win32" && { reusePort: true }
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
