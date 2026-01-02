-- ============================================================================
-- STUDY CREDITS SYSTEM
-- Complete schema for credit-based pricing model
-- ============================================================================

-- ============================================================================
-- 1. USER CREDITS (Balance Tracking)
-- ============================================================================

CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0, -- Current credit balance
  lifetime_earned INTEGER NOT NULL DEFAULT 0, -- Total credits ever earned
  lifetime_spent INTEGER NOT NULL DEFAULT 0, -- Total credits ever spent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id) -- One balance per user
);

CREATE INDEX idx_user_credits_user ON user_credits(user_id);

-- RLS: Users can only view/update their own balance
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. CREDIT TRANSACTIONS (Full Audit Trail)
-- ============================================================================

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive = earned, Negative = spent
  transaction_type TEXT NOT NULL, -- 'purchase', 'refund', 'processing', 'generation', 'bonus', 'gift', 'adjustment'
  reference_type TEXT, -- 'document', 'topic', 'package', 'job'
  reference_id UUID, -- ID of related entity (document_id, topic_id, package_id, job_id, etc.)
  description TEXT NOT NULL, -- Human-readable description
  metadata JSONB DEFAULT '{}', -- Additional context (page_count, complexity, topics_count, etc.)
  balance_after INTEGER NOT NULL, -- Balance after this transaction (for verification)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_transaction_type CHECK (
    transaction_type IN ('purchase', 'refund', 'processing', 'generation', 'bonus', 'gift', 'adjustment')
  )
);

CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_reference ON credit_transactions(reference_type, reference_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);

-- RLS: Users can only view their own transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 3. CREDIT PACKAGES (Available for Purchase)
-- ============================================================================

CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "Starter Pack", "Student Bundle", etc.
  credits INTEGER NOT NULL, -- Number of credits in package
  price_amount DECIMAL(10,2) NOT NULL, -- Price in local currency
  price_currency TEXT NOT NULL DEFAULT 'USD', -- 'USD' or 'NGN'
  country_code TEXT, -- NULL = available everywhere, or specific country (e.g., 'NG')
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- For sorting in UI
  bonus_credits INTEGER DEFAULT 0, -- Extra credits (e.g., "Buy 100, get 20 free")
  description TEXT, -- Marketing description
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_currency CHECK (price_currency IN ('USD', 'NGN'))
);

CREATE INDEX idx_credit_packages_active ON credit_packages(is_active, display_order);
CREATE INDEX idx_credit_packages_country ON credit_packages(country_code) WHERE country_code IS NOT NULL;

-- RLS: Public read access (anyone can see packages)
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active packages" ON credit_packages
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- 4. DOCUMENT PROCESSING JOBS (Credit Consumption Tracking)
-- ============================================================================

CREATE TABLE document_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estimated_credits INTEGER NOT NULL, -- Estimated before processing
  actual_credits INTEGER, -- Actual credits consumed (after processing, NULL if pending)
  processing_type TEXT NOT NULL, -- 'initial', 'regenerate_flashcards', 'regenerate_questions', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'refunded'
  credits_deducted_at TIMESTAMPTZ, -- When credits were deducted
  refunded_at TIMESTAMPTZ, -- If refunded, when
  error_message TEXT, -- If failed, why
  metadata JSONB DEFAULT '{}', -- { page_count, complexity, topics_count, etc. }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'refunded')
  ),
  CONSTRAINT valid_processing_type CHECK (
    processing_type IN ('initial', 'regenerate_flashcards', 'regenerate_questions', 'regenerate_explanations', 'regenerate_vocabulary')
  )
);

CREATE INDEX idx_processing_jobs_document ON document_processing_jobs(document_id);
CREATE INDEX idx_processing_jobs_user ON document_processing_jobs(user_id);
CREATE INDEX idx_processing_jobs_status ON document_processing_jobs(status);
CREATE INDEX idx_processing_jobs_created ON document_processing_jobs(created_at DESC);

-- RLS: Users can only view their own jobs
ALTER TABLE document_processing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own processing jobs" ON document_processing_jobs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Initialize credits for new user
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance, lifetime_earned, lifetime_spent)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create credits record when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_credits();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at for user_credits
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for credit_packages
CREATE TRIGGER update_credit_packages_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for document_processing_jobs
CREATE TRIGGER update_processing_jobs_updated_at
  BEFORE UPDATE ON document_processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. DEFAULT CREDIT PACKAGES (Seed Data)
-- ============================================================================

-- Starter Pack (USD)
INSERT INTO credit_packages (name, credits, price_amount, price_currency, country_code, display_order, bonus_credits, description)
VALUES 
  ('Starter Pack', 50, 5.00, 'USD', NULL, 1, 0, 'Perfect for trying out the platform'),
  ('Student Bundle', 200, 15.00, 'USD', NULL, 2, 20, 'Best value for students - includes 20 bonus credits'),
  ('Scholar Pack', 500, 35.00, 'USD', NULL, 3, 50, 'Great for heavy users - includes 50 bonus credits'),
  ('Master Bundle', 1000, 60.00, 'USD', NULL, 4, 150, 'Maximum value - includes 150 bonus credits');

-- Starter Pack (NGN - Nigeria)
INSERT INTO credit_packages (name, credits, price_amount, price_currency, country_code, display_order, bonus_credits, description)
VALUES 
  ('Starter Pack', 50, 2000.00, 'NGN', 'NG', 1, 0, 'Perfect for trying out the platform'),
  ('Student Bundle', 200, 6000.00, 'NGN', 'NG', 2, 20, 'Best value for students - includes 20 bonus credits'),
  ('Scholar Pack', 500, 14000.00, 'NGN', 'NG', 3, 50, 'Great for heavy users - includes 50 bonus credits'),
  ('Master Bundle', 1000, 24000.00, 'NGN', 'NG', 4, 150, 'Maximum value - includes 150 bonus credits');

-- ============================================================================
-- 7. HELPER FUNCTIONS (For Credit Operations)
-- ============================================================================

-- Function: Get user credit balance (safe, with RLS)
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add credits to user (for purchases, bonuses, refunds)
-- Note: This should be called from backend service with proper transaction handling
CREATE OR REPLACE FUNCTION add_credits_to_user(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
  v_current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock row for update
  
  -- If user doesn't have credits record, create it
  IF v_current_balance IS NULL THEN
    INSERT INTO user_credits (user_id, balance, lifetime_earned, lifetime_spent)
    VALUES (p_user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO UPDATE SET balance = user_credits.balance;
    
    SELECT balance INTO v_current_balance
    FROM user_credits
    WHERE user_id = p_user_id;
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;
  
  -- Update balance
  UPDATE user_credits
  SET 
    balance = v_new_balance,
    lifetime_earned = lifetime_earned + GREATEST(p_amount, 0),
    lifetime_spent = lifetime_spent + ABS(LEAST(p_amount, 0)),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reference_type,
    reference_id,
    description,
    metadata,
    balance_after
  ) VALUES (
    p_user_id,
    p_amount,
    p_transaction_type,
    p_reference_type,
    p_reference_id,
    p_description,
    p_metadata,
    v_new_balance
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Deduct credits from user (for processing, generation)
-- Note: This should be called from backend service with proper transaction handling
CREATE OR REPLACE FUNCTION deduct_credits_from_user(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
  v_current_balance INTEGER;
BEGIN
  -- Get current balance with lock
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if user exists
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User credits record not found';
  END IF;
  
  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Current balance: %, Required: %', v_current_balance, p_amount;
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;
  
  -- Update balance
  UPDATE user_credits
  SET 
    balance = v_new_balance,
    lifetime_spent = lifetime_spent + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create transaction record (negative amount)
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reference_type,
    reference_id,
    description,
    metadata,
    balance_after
  ) VALUES (
    p_user_id,
    -p_amount,
    p_transaction_type,
    p_reference_type,
    p_reference_id,
    p_description,
    p_metadata,
    v_new_balance
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

