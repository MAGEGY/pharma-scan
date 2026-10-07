-- Hot-path indexes for Pharma-Scan
-- Run on Postgres with superuser or privileges to create indexes.
-- Note: CREATE INDEX CONCURRENTLY cannot run inside a transaction block.

-- drug_reviews: support queries by drug_id ordered by created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drug_reviews_drug_created_at
  ON drug_reviews (drug_id, created_at DESC);

-- medical_questions: category filters ordered by created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_questions_category_created_at
  ON medical_questions (category, created_at DESC);

-- price_history: history lookups by drug and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_price_history_drug_created_at
  ON price_history (drug_id, created_at DESC);

-- market_intelligence: fetch latest per drug/region
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_intel_drug_region_checked
  ON market_intelligence (drug_id, region, last_checked DESC);
