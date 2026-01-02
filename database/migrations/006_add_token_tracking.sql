-- ============================================================================
-- TOKEN USAGE TRACKING
-- Track AI token usage for cost analysis and credit pricing
-- 
-- PREREQUISITE: This migration requires migration 005_create_credits_system.sql
-- to be run first, as it depends on the document_processing_jobs table.
-- ============================================================================

-- Check if document_processing_jobs exists, if not, create it first
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_processing_jobs') THEN
    RAISE EXCEPTION 'Table document_processing_jobs does not exist. Please run migration 005_create_credits_system.sql first.';
  END IF;
END $$;

-- Add token usage fields to document_processing_jobs (only if they don't exist)
DO $$
BEGIN
  -- Add total_tokens if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_processing_jobs' AND column_name = 'total_tokens'
  ) THEN
    ALTER TABLE document_processing_jobs ADD COLUMN total_tokens INTEGER DEFAULT 0;
  END IF;

  -- Add prompt_tokens if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_processing_jobs' AND column_name = 'prompt_tokens'
  ) THEN
    ALTER TABLE document_processing_jobs ADD COLUMN prompt_tokens INTEGER DEFAULT 0;
  END IF;

  -- Add completion_tokens if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_processing_jobs' AND column_name = 'completion_tokens'
  ) THEN
    ALTER TABLE document_processing_jobs ADD COLUMN completion_tokens INTEGER DEFAULT 0;
  END IF;

  -- Add ai_model if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_processing_jobs' AND column_name = 'ai_model'
  ) THEN
    ALTER TABLE document_processing_jobs ADD COLUMN ai_model TEXT;
  END IF;

  -- Add estimated_cost_usd if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_processing_jobs' AND column_name = 'estimated_cost_usd'
  ) THEN
    ALTER TABLE document_processing_jobs ADD COLUMN estimated_cost_usd DECIMAL(10,6) DEFAULT 0;
  END IF;
END $$;

-- Create table for individual AI operation token tracking
CREATE TABLE ai_operation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processing_job_id UUID REFERENCES document_processing_jobs(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL, -- 'extract_topics', 'generate_flashcards', 'generate_questions', 'generate_vocabulary', 'generate_explanations'
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  ai_model TEXT NOT NULL, -- e.g., 'anthropic/claude-3.5-sonnet'
  estimated_cost_usd DECIMAL(10,6) DEFAULT 0, -- Estimated cost for this operation
  metadata JSONB DEFAULT '{}', -- Additional context (topic_id, topic_title, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_operation_type CHECK (
    operation_type IN ('extract_topics', 'generate_flashcards', 'generate_questions', 'generate_vocabulary', 'generate_explanations')
  )
);

CREATE INDEX idx_ai_tokens_job ON ai_operation_tokens(processing_job_id);
CREATE INDEX idx_ai_tokens_document ON ai_operation_tokens(document_id);
CREATE INDEX idx_ai_tokens_user ON ai_operation_tokens(user_id);
CREATE INDEX idx_ai_tokens_operation ON ai_operation_tokens(operation_type);
CREATE INDEX idx_ai_tokens_created ON ai_operation_tokens(created_at DESC);

-- RLS: Users can only view their own token usage
ALTER TABLE ai_operation_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own token usage" ON ai_operation_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Function: Calculate estimated cost based on model and tokens
-- This uses approximate pricing (update with actual OpenRouter pricing)
CREATE OR REPLACE FUNCTION calculate_token_cost(
  p_model TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER
)
RETURNS DECIMAL(10,6) AS $$
DECLARE
  v_cost DECIMAL(10,6) := 0;
  v_prompt_price_per_1k DECIMAL(10,6);
  v_completion_price_per_1k DECIMAL(10,6);
BEGIN
  -- Pricing per 1M tokens (approximate, update with actual OpenRouter pricing)
  -- Claude 3.5 Sonnet pricing (as of 2024): ~$3 input, $15 output per 1M tokens
  IF p_model LIKE '%claude-3.5-sonnet%' THEN
    v_prompt_price_per_1k := 0.003; -- $3 per 1M = $0.003 per 1K
    v_completion_price_per_1k := 0.015; -- $15 per 1M = $0.015 per 1K
  ELSIF p_model LIKE '%claude-3-opus%' THEN
    v_prompt_price_per_1k := 0.015; -- $15 per 1M
    v_completion_price_per_1k := 0.075; -- $75 per 1M
  ELSIF p_model LIKE '%gpt-4%' THEN
    v_prompt_price_per_1k := 0.03; -- $30 per 1M
    v_completion_price_per_1k := 0.06; -- $60 per 1M
  ELSIF p_model LIKE '%gpt-3.5%' THEN
    v_prompt_price_per_1k := 0.0005; -- $0.5 per 1M
    v_completion_price_per_1k := 0.0015; -- $1.5 per 1M
  ELSE
    -- Default to Claude 3.5 Sonnet pricing
    v_prompt_price_per_1k := 0.003;
    v_completion_price_per_1k := 0.015;
  END IF;
  
  v_cost := (p_prompt_tokens::DECIMAL / 1000.0 * v_prompt_price_per_1k) +
            (p_completion_tokens::DECIMAL / 1000.0 * v_completion_price_per_1k);
  
  RETURN ROUND(v_cost, 6);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Update processing job with aggregated token usage
CREATE OR REPLACE FUNCTION update_job_token_usage(p_job_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_tokens INTEGER;
  v_prompt_tokens INTEGER;
  v_completion_tokens INTEGER;
  v_total_cost DECIMAL(10,6);
BEGIN
  SELECT 
    COALESCE(SUM(total_tokens), 0),
    COALESCE(SUM(prompt_tokens), 0),
    COALESCE(SUM(completion_tokens), 0),
    COALESCE(SUM(estimated_cost_usd), 0)
  INTO v_total_tokens, v_prompt_tokens, v_completion_tokens, v_total_cost
  FROM ai_operation_tokens
  WHERE processing_job_id = p_job_id;
  
  UPDATE document_processing_jobs
  SET 
    total_tokens = v_total_tokens,
    prompt_tokens = v_prompt_tokens,
    completion_tokens = v_completion_tokens,
    estimated_cost_usd = v_total_cost,
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- View: Token usage summary by operation type
CREATE OR REPLACE VIEW token_usage_summary AS
SELECT 
  operation_type,
  COUNT(*) as operation_count,
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(completion_tokens) as total_completion_tokens,
  SUM(total_tokens) as total_tokens,
  SUM(estimated_cost_usd) as total_cost_usd,
  AVG(total_tokens) as avg_tokens_per_operation,
  AVG(estimated_cost_usd) as avg_cost_per_operation,
  MIN(created_at) as first_operation,
  MAX(created_at) as last_operation
FROM ai_operation_tokens
GROUP BY operation_type;

-- View: Token usage by document
CREATE OR REPLACE VIEW document_token_usage AS
SELECT 
  d.id as document_id,
  d.title as document_title,
  d.user_id,
  COUNT(DISTINCT aot.id) as operation_count,
  SUM(aot.prompt_tokens) as total_prompt_tokens,
  SUM(aot.completion_tokens) as total_completion_tokens,
  SUM(aot.total_tokens) as total_tokens,
  SUM(aot.estimated_cost_usd) as total_cost_usd,
  dpj.actual_credits as credits_charged
FROM documents d
LEFT JOIN document_processing_jobs dpj ON dpj.document_id = d.id
LEFT JOIN ai_operation_tokens aot ON aot.document_id = d.id
GROUP BY d.id, d.title, d.user_id, dpj.actual_credits;

