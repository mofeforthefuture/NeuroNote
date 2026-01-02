-- Create complete database schema for NeuroNote
-- Run this after 001_drop_all_tables.sql

-- ============================================================================
-- 1. USER PROFILES
-- ============================================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  country_code TEXT, -- ISO 3166-1 alpha-2 (e.g., 'NG', 'US') for pricing calculation
  is_medical_field BOOLEAN DEFAULT false, -- Medical field users pay 2x
  study_preferences JSONB DEFAULT '{}', -- { theme: 'dark', font_size: 'medium', etc }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_country_code CHECK (country_code IS NULL OR char_length(country_code) = 2)
);

-- RLS: Users can only read/update/insert their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- 2. SHARED DOCUMENT CONTENT (for deduplication)
-- ============================================================================

CREATE TABLE shared_document_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of PDF (matches documents.content_hash)
  first_processed_at TIMESTAMPTZ DEFAULT NOW(), -- When first document with this hash was processed
  processing_version INTEGER DEFAULT 1, -- Version of AI processing (increments if improved)
  document_metadata JSONB DEFAULT '{}', -- { title, author, page_count, etc } from first processing
  usage_count INTEGER DEFAULT 1, -- How many users have documents with this hash
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_shared_content_hash ON shared_document_content(content_hash);
CREATE INDEX idx_shared_content_usage ON shared_document_content(usage_count DESC);

-- RLS: Shared content is read-only for authenticated users (for cloning)
ALTER TABLE shared_document_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read shared content" ON shared_document_content
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- 3. DOCUMENTS
-- ============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size BIGINT,
  page_count INTEGER,
  content_hash TEXT NOT NULL, -- SHA-256 hash of PDF file content (for deduplication)
  shared_content_id UUID REFERENCES shared_document_content(id) ON DELETE SET NULL, -- If cloned from existing processing
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ, -- When AI extraction completed
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  metadata JSONB DEFAULT '{}', -- { author, subject, year, etc }

  CONSTRAINT valid_status CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(processing_status);
CREATE UNIQUE INDEX idx_documents_content_hash ON documents(content_hash); -- Fast lookup for deduplication
CREATE INDEX idx_documents_shared_content ON documents(shared_content_id) WHERE shared_content_id IS NOT NULL;

-- RLS: Users can only access their own documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 4. TOPICS
-- ============================================================================

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  page_references INTEGER[], -- Array of page numbers where topic appears
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(document_id, title) -- Prevent duplicate topics per document
);

CREATE INDEX idx_topics_document ON topics(document_id);
CREATE INDEX idx_topics_title ON topics USING gin(to_tsvector('english', title));

-- RLS: Inherited from documents (users can only see topics from their documents)
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view topics from own documents" ON topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = topics.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. FLASHCARDS
-- ============================================================================

CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  difficulty_level TEXT DEFAULT 'medium', -- easy, medium, hard
  ai_generated BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1, -- For AI content versioning
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_difficulty CHECK (difficulty_level IN ('easy', 'medium', 'hard'))
);

CREATE INDEX idx_flashcards_topic ON flashcards(topic_id);

-- RLS: Inherited from topics
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view flashcards from own topics" ON flashcards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = flashcards.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. EXAM QUESTIONS
-- ============================================================================

CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL, -- mcq, short_answer, true_false, essay
  question_text TEXT NOT NULL,
  correct_answer TEXT, -- For MCQ: option key, for others: answer text
  options JSONB, -- For MCQ: { a: "option text", b: "option text", ... }
  explanation TEXT, -- Why the answer is correct
  points INTEGER DEFAULT 1,
  ai_generated BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_question_type CHECK (question_type IN ('mcq', 'short_answer', 'true_false', 'essay'))
);

CREATE INDEX idx_exam_questions_topic ON exam_questions(topic_id);
CREATE INDEX idx_exam_questions_type ON exam_questions(question_type);

-- RLS: Inherited from topics
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view questions from own topics" ON exam_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = exam_questions.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. VOCABULARY TERMS
-- ============================================================================

CREATE TABLE vocabulary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE, -- For terms not tied to specific topic
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  etymology TEXT,
  pronunciation TEXT, -- IPA or phonetic spelling
  context_sentences TEXT[], -- Example sentences from document
  difficulty_level TEXT DEFAULT 'medium',
  ai_generated BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_difficulty CHECK (difficulty_level IN ('easy', 'medium', 'hard'))
);

CREATE INDEX idx_vocabulary_topic ON vocabulary_terms(topic_id);
CREATE INDEX idx_vocabulary_document ON vocabulary_terms(document_id);
CREATE INDEX idx_vocabulary_term ON vocabulary_terms USING gin(to_tsvector('english', term));

-- RLS: Inherited from documents
ALTER TABLE vocabulary_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view vocabulary from own documents" ON vocabulary_terms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = vocabulary_terms.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. CONCEPT EXPLANATIONS
-- ============================================================================

CREATE TABLE concept_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  explanation_level TEXT NOT NULL, -- eli5, beginner, intermediate, advanced
  explanation_text TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_level CHECK (explanation_level IN ('eli5', 'beginner', 'intermediate', 'advanced')),
  UNIQUE(topic_id, explanation_level) -- One explanation per level per topic
);

CREATE INDEX idx_concept_explanations_topic ON concept_explanations(topic_id);

-- RLS: Inherited from topics
ALTER TABLE concept_explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view explanations from own topics" ON concept_explanations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = concept_explanations.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. USER PROGRESS
-- ============================================================================

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- flashcard, exam_question, vocabulary_term
  content_id UUID NOT NULL, -- References flashcard.id, exam_question.id, or vocabulary_term.id
  mastery_level INTEGER DEFAULT 0, -- 0-100 scale
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ, -- Spaced repetition scheduling
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  ease_factor DECIMAL(3,2) DEFAULT 2.5, -- SM-2 algorithm parameter
  interval_days INTEGER DEFAULT 1, -- Days until next review
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_content_type CHECK (content_type IN ('flashcard', 'exam_question', 'vocabulary_term')),
  UNIQUE(user_id, content_type, content_id) -- One progress record per content item per user
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_next_review ON user_progress(next_review_at) WHERE next_review_at IS NOT NULL;
CREATE INDEX idx_user_progress_content ON user_progress(content_type, content_id);

-- RLS: Users can only see their own progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 10. USER NOTES
-- ============================================================================

CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, topic_id) -- One note per topic per user
);

CREATE INDEX idx_user_notes_user ON user_notes(user_id);
CREATE INDEX idx_user_notes_topic ON user_notes(topic_id);

-- RLS: Users can only see their own notes
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notes" ON user_notes
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 11. SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'trial', -- trial, active, past_due, cancelled, expired
  subscription_tier TEXT NOT NULL, -- base, medical (determines pricing multiplier)
  country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2 for pricing
  currency TEXT NOT NULL, -- NGN or USD
  amount DECIMAL(10,2) NOT NULL, -- Monthly subscription amount
  trial_ends_at TIMESTAMPTZ, -- When free trial ends
  current_period_start TIMESTAMPTZ, -- Start of current billing period
  current_period_end TIMESTAMPTZ, -- End of current billing period (next billing date)
  cancel_at_period_end BOOLEAN DEFAULT false, -- User cancelled but has access until period_end
  cancelled_at TIMESTAMPTZ, -- When user cancelled
  payment_provider TEXT, -- 'stripe', 'flutterwave', 'paystack'
  payment_provider_customer_id TEXT, -- Customer ID in payment provider
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  CONSTRAINT valid_tier CHECK (subscription_tier IN ('base', 'medical')),
  CONSTRAINT valid_currency CHECK (currency IN ('NGN', 'USD')),
  UNIQUE(user_id) -- One subscription per user
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';

-- RLS: Users can only see their own subscription
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 12. PAYMENTS
-- ============================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL, -- NGN or USD
  status TEXT NOT NULL, -- pending, succeeded, failed, refunded
  payment_provider TEXT NOT NULL, -- 'stripe', 'flutterwave', 'paystack'
  payment_provider_payment_id TEXT NOT NULL, -- Payment ID from provider
  payment_method TEXT, -- 'card', 'bank_transfer', 'mobile_money'
  billing_period_start TIMESTAMPTZ, -- Period this payment covers
  billing_period_end TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ, -- If refunded, when
  refund_amount DECIMAL(10,2), -- Refund amount (if partial)
  failure_reason TEXT, -- Why payment failed (if status = 'failed')
  metadata JSONB DEFAULT '{}', -- Additional provider-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  CONSTRAINT valid_currency CHECK (currency IN ('NGN', 'USD')),
  CONSTRAINT valid_provider CHECK (payment_provider IN ('stripe', 'flutterwave', 'paystack'))
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_id ON payments(payment_provider, payment_provider_payment_id);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

-- RLS: Users can only see their own payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

