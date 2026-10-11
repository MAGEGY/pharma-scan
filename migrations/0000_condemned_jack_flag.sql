CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255),
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" varchar(255),
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"success" boolean NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "dosage_guidelines" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drug_id" integer NOT NULL,
	"age_group" varchar(50) NOT NULL,
	"weight_range" varchar(50),
	"condition" varchar(255),
	"dosage_per_kg" varchar(255),
	"max_daily_dose" varchar(255),
	"frequency" varchar(255),
	"duration" varchar(255),
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "drug_interactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drug_1_id" integer NOT NULL,
	"drug_2_id" integer NOT NULL,
	"severity" varchar(20) NOT NULL,
	"interaction_type" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"recommendation" text,
	"evidence_level" varchar(20) DEFAULT 'moderate',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "drug_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"drug_id" integer NOT NULL,
	"drug_name" varchar(255) NOT NULL,
	"active_ingredient" varchar(255),
	"dosage" varchar(255),
	"frequency" varchar(255),
	"duration" varchar(255),
	"effectiveness" varchar(20) NOT NULL,
	"side_effects" jsonb,
	"interactions" jsonb,
	"rating" integer NOT NULL,
	"review" text,
	"pros" text,
	"cons" text,
	"is_verified" boolean DEFAULT false,
	"helpful" integer DEFAULT 0,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "egyptian_drugs" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_arabic" varchar(255) NOT NULL,
	"active_ingredient" varchar(255),
	"price" numeric(10, 2),
	"manufacturer" varchar(255),
	"description_arabic" text,
	"description_english" text,
	"category" varchar(100),
	"form" varchar(100),
	"dosing" text,
	"interactions" jsonb,
	"contraindications" jsonb,
	"side_effects" jsonb,
	"last_price_update" timestamp DEFAULT NOW(),
	"price_verified" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT NOW(),
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "export_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"export_type" varchar(50) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"content_data" jsonb NOT NULL,
	"file_name" varchar(255),
	"file_size" integer,
	"format" varchar(50),
	"delivery_method" varchar(100),
	"recipient_email" varchar(255),
	"status" varchar(50) DEFAULT 'pending',
	"download_url" varchar(500),
	"expires_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "help_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"query" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"question" text NOT NULL,
	"context" jsonb,
	"metadata" jsonb,
	"response" text,
	"is_answered" boolean DEFAULT false,
	"answered_by" varchar(255),
	"answered_at" timestamp,
	"assigned_to" varchar(255),
	"assigned_at" timestamp,
	"priority" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'open',
	"helpful" integer DEFAULT 0,
	"sources" jsonb,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "help_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar(255) NOT NULL,
	"answer" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"helpful" integer DEFAULT 0,
	"sources" jsonb,
	"is_automated" boolean DEFAULT false,
	"confidence" numeric(3, 2),
	"responded_by" varchar(255),
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "market_intelligence" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drug_id" integer NOT NULL,
	"region" varchar(100) NOT NULL,
	"availability_status" varchar(50) NOT NULL,
	"stock_level" integer,
	"demand_level" varchar(50) NOT NULL,
	"seasonality" varchar(50),
	"competitor_pricing" jsonb,
	"market_share" numeric(5, 2),
	"forecast_demand" integer,
	"recommended_action" varchar(255),
	"insights" jsonb,
	"data_source" varchar(100),
	"reliability" integer DEFAULT 5,
	"last_checked" timestamp DEFAULT NOW(),
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "medical_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"drug_id" integer,
	"drug_name" varchar(255),
	"question" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"answer" text,
	"is_answered" boolean DEFAULT false,
	"asked_by" varchar(255),
	"answered_by" varchar(255),
	"helpful" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"is_moderated" boolean DEFAULT false,
	"is_public" boolean DEFAULT true,
	"tags" jsonb,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT NOW(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pharmacy_sources" (
	"id" integer PRIMARY KEY DEFAULT NEXTVAL('pharmacy_sources_id_seq') NOT NULL,
	"name" varchar(100) NOT NULL,
	"website" varchar(255),
	"api_key" varchar(255),
	"is_active" boolean DEFAULT true,
	"last_sync" timestamp,
	"region" varchar(100),
	"reliability" integer DEFAULT 5
);
--> statement-breakpoint
CREATE TABLE "prescription_backups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"backup_data" jsonb NOT NULL,
	"backup_type" varchar(50) NOT NULL,
	"device_id" varchar(255),
	"cloud_provider" varchar(100),
	"cloud_path" varchar(500),
	"checksum" varchar(64),
	"is_encrypted" boolean DEFAULT true,
	"backup_size" integer,
	"sync_status" varchar(50) DEFAULT 'pending',
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" integer PRIMARY KEY DEFAULT NEXTVAL('price_history_id_seq') NOT NULL,
	"drug_id" integer NOT NULL,
	"old_price" numeric(10, 2),
	"new_price" numeric(10, 2) NOT NULL,
	"pharmacy" varchar(100),
	"region" varchar(100),
	"source" varchar(100),
	"verified" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "price_trends" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drug_id" integer NOT NULL,
	"region" varchar(100) NOT NULL,
	"pharmacy" varchar(255),
	"current_price" numeric(10, 2) NOT NULL,
	"previous_price" numeric(10, 2),
	"price_change" numeric(10, 2),
	"price_change_percent" numeric(5, 2),
	"trend_direction" varchar(20) NOT NULL,
	"trend_strength" varchar(20) NOT NULL,
	"predicted_price" numeric(10, 2),
	"confidence" numeric(3, 2),
	"data_points" integer DEFAULT 1,
	"analysis_period" varchar(50) NOT NULL,
	"last_updated" timestamp DEFAULT NOW(),
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"issue_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100),
	"priority" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'open',
	"assigned_to" varchar(255),
	"assigned_at" timestamp,
	"resolved_at" timestamp,
	"resolved_by" varchar(255),
	"due_date" timestamp,
	"resolution_time" integer,
	"attachments" jsonb,
	"internal_notes" text,
	"user_satisfaction" integer,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "usage_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_data" jsonb,
	"session_id" varchar(255),
	"device_id" varchar(255),
	"app_version" varchar(50),
	"platform" varchar(50),
	"duration" integer,
	"success" boolean DEFAULT true,
	"error_message" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"location" jsonb,
	"created_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "user_allergies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"allergen_type" varchar(50) NOT NULL,
	"allergen_name" varchar(255) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"reaction" text,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "user_consents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"consent_type" varchar(50) NOT NULL,
	"consent_version" varchar(20) NOT NULL,
	"is_consented" boolean NOT NULL,
	"consented_at" timestamp DEFAULT NOW(),
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "user_prescriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"drug_id" integer NOT NULL,
	"drug_name" varchar(255) NOT NULL,
	"dosage" varchar(255) NOT NULL,
	"frequency" varchar(255) NOT NULL,
	"duration" varchar(255),
	"prescribed_by" varchar(255),
	"prescribed_date" timestamp,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"session_token" varchar(500) NOT NULL,
	"refresh_token" varchar(500),
	"device_info" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT NOW(),
	"last_accessed_at" timestamp DEFAULT NOW(),
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token"),
	CONSTRAINT "user_sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"enable_drug_interaction_checker" boolean DEFAULT true,
	"enable_allergy_alerts" boolean DEFAULT true,
	"enable_dosage_calculator" boolean DEFAULT true,
	"preferred_language" varchar(10) DEFAULT 'en',
	"preferred_units" varchar(10) DEFAULT 'metric',
	"notifications_enabled" boolean DEFAULT true,
	"dark_mode" boolean DEFAULT false,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW(),
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"salt" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"date_of_birth" timestamp,
	"gender" varchar(10),
	"profile_picture" text,
	"is_email_verified" boolean DEFAULT false,
	"is_phone_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_premium" boolean DEFAULT false,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT NOW(),
	"updated_at" timestamp DEFAULT NOW(),
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "dosage_guidelines_drug_id_idx" ON "dosage_guidelines" USING btree ("drug_id");--> statement-breakpoint
CREATE INDEX "dosage_guidelines_age_group_idx" ON "dosage_guidelines" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX "dosage_guidelines_is_active_idx" ON "dosage_guidelines" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "drug_interactions_drug_1_id_idx" ON "drug_interactions" USING btree ("drug_1_id");--> statement-breakpoint
CREATE INDEX "drug_interactions_drug_2_id_idx" ON "drug_interactions" USING btree ("drug_2_id");--> statement-breakpoint
CREATE INDEX "drug_interactions_severity_idx" ON "drug_interactions" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "drug_interactions_is_active_idx" ON "drug_interactions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "drug_reviews_user_id_idx" ON "drug_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "drug_reviews_drug_id_idx" ON "drug_reviews" USING btree ("drug_id");--> statement-breakpoint
CREATE INDEX "drug_reviews_rating_idx" ON "drug_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "drug_reviews_effectiveness_idx" ON "drug_reviews" USING btree ("effectiveness");--> statement-breakpoint
CREATE INDEX "drug_reviews_created_at_idx" ON "drug_reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "drugs_name_idx" ON "egyptian_drugs" USING btree ("name");--> statement-breakpoint
CREATE INDEX "drugs_name_arabic_idx" ON "egyptian_drugs" USING btree ("name_arabic");--> statement-breakpoint
CREATE INDEX "drugs_active_ingredient_idx" ON "egyptian_drugs" USING btree ("active_ingredient");--> statement-breakpoint
CREATE INDEX "drugs_category_idx" ON "egyptian_drugs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "drugs_manufacturer_idx" ON "egyptian_drugs" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX "drugs_price_idx" ON "egyptian_drugs" USING btree ("price");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_email_idx" ON "email_verification_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "export_history_user_id_idx" ON "export_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "export_history_type_idx" ON "export_history" USING btree ("export_type");--> statement-breakpoint
CREATE INDEX "export_history_status_idx" ON "export_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "export_history_created_at_idx" ON "export_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "help_requests_user_id_idx" ON "help_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "help_requests_category_idx" ON "help_requests" USING btree ("category");--> statement-breakpoint
CREATE INDEX "help_requests_status_idx" ON "help_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "help_requests_priority_idx" ON "help_requests" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "help_requests_is_answered_idx" ON "help_requests" USING btree ("is_answered");--> statement-breakpoint
CREATE INDEX "help_requests_created_at_idx" ON "help_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "help_responses_request_id_idx" ON "help_responses" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "help_responses_category_idx" ON "help_responses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "help_responses_created_at_idx" ON "help_responses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "market_intelligence_drug_id_idx" ON "market_intelligence" USING btree ("drug_id");--> statement-breakpoint
CREATE INDEX "market_intelligence_region_idx" ON "market_intelligence" USING btree ("region");--> statement-breakpoint
CREATE INDEX "market_intelligence_status_idx" ON "market_intelligence" USING btree ("availability_status");--> statement-breakpoint
CREATE INDEX "market_intelligence_demand_idx" ON "market_intelligence" USING btree ("demand_level");--> statement-breakpoint
CREATE INDEX "market_intelligence_last_checked_idx" ON "market_intelligence" USING btree ("last_checked");--> statement-breakpoint
CREATE INDEX "medical_questions_user_id_idx" ON "medical_questions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "medical_questions_drug_id_idx" ON "medical_questions" USING btree ("drug_id");--> statement-breakpoint
CREATE INDEX "medical_questions_category_idx" ON "medical_questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "medical_questions_is_answered_idx" ON "medical_questions" USING btree ("is_answered");--> statement-breakpoint
CREATE INDEX "medical_questions_is_public_idx" ON "medical_questions" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "medical_questions_created_at_idx" ON "medical_questions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "pharmacy_sources_name_idx" ON "pharmacy_sources" USING btree ("name");--> statement-breakpoint
CREATE INDEX "pharmacy_sources_region_idx" ON "pharmacy_sources" USING btree ("region");--> statement-breakpoint
CREATE INDEX "prescription_backups_user_id_idx" ON "prescription_backups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prescription_backups_type_idx" ON "prescription_backups" USING btree ("backup_type");--> statement-breakpoint
CREATE INDEX "prescription_backups_sync_status_idx" ON "prescription_backups" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "prescription_backups_created_at_idx" ON "prescription_backups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "price_history_drug_id_idx" ON "price_history" USING btree ("drug_id");--> statement-breakpoint
CREATE INDEX "price_history_created_at_idx" ON "price_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "price_history_pharmacy_idx" ON "price_history" USING btree ("pharmacy");--> statement-breakpoint
CREATE INDEX "price_trends_drug_id_idx" ON "price_trends" USING btree ("drug_id");--> statement-breakpoint
CREATE INDEX "price_trends_region_idx" ON "price_trends" USING btree ("region");--> statement-breakpoint
CREATE INDEX "price_trends_pharmacy_idx" ON "price_trends" USING btree ("pharmacy");--> statement-breakpoint
CREATE INDEX "price_trends_direction_idx" ON "price_trends" USING btree ("trend_direction");--> statement-breakpoint
CREATE INDEX "price_trends_last_updated_idx" ON "price_trends" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_tickets_issue_type_idx" ON "support_tickets" USING btree ("issue_type");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "support_tickets_assigned_to_idx" ON "support_tickets" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "support_tickets_created_at_idx" ON "support_tickets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "usage_analytics_user_id_idx" ON "usage_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "usage_analytics_event_type_idx" ON "usage_analytics" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "usage_analytics_session_id_idx" ON "usage_analytics" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "usage_analytics_created_at_idx" ON "usage_analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_allergies_user_id_idx" ON "user_allergies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_allergies_type_idx" ON "user_allergies" USING btree ("allergen_type");--> statement-breakpoint
CREATE INDEX "user_allergies_name_idx" ON "user_allergies" USING btree ("allergen_name");--> statement-breakpoint
CREATE INDEX "user_allergies_is_active_idx" ON "user_allergies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "user_consents_user_id_idx" ON "user_consents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_consents_type_idx" ON "user_consents" USING btree ("consent_type");--> statement-breakpoint
CREATE INDEX "user_prescriptions_user_id_idx" ON "user_prescriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_prescriptions_drug_id_idx" ON "user_prescriptions" USING btree ("drug_id");--> statement-breakpoint
CREATE INDEX "user_prescriptions_is_active_idx" ON "user_prescriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "user_prescriptions_prescribed_date_idx" ON "user_prescriptions" USING btree ("prescribed_date");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_token_idx" ON "user_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "user_sessions_refresh_token_idx" ON "user_sessions" USING btree ("refresh_token");--> statement-breakpoint
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_sessions_is_active_idx" ON "user_sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "user_settings_user_id_idx" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");