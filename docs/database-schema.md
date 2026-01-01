# Database Schema Design

## Design Philosophy

**Why this structure:**

- **Separation of concerns**: Content, progress, and community are isolated to prevent cognitive overload in queries
- **Versioning**: AI-generated content is versioned to allow improvements without breaking user progress
- **Privacy-first**: RLS ensures users only see their own data unless explicitly sharing
- **Extensibility**: Schema supports Phase 2 community features without migration pain
- **Performance**: Indexed relationships prevent N+1 queries during study sessions

---

## Core Tables

### 1. `users` (Supabase Auth extension)

- Managed by Supabase Auth
- Additional profile data in `user_profiles`

### 2. `user_profiles`

**Purpose**: Extended user information, preferences, and learning settings

```sql
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

-- RLS: Users can only read/update their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
```

**Why separate from auth.users:**

- Keeps auth concerns separate from app data
- Allows flexible JSONB preferences without schema migrations
- Easier to extend with learning-specific metadata

---

### 3. `documents`

**Purpose**: PDF uploads and metadata

```sql
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
```

**Why this structure:**

- `processing_status` prevents UI from showing incomplete data
- `metadata` JSONB allows flexible document attributes without migrations
- Separate `processed_at` enables retry logic
- `content_hash` enables deduplication (same PDF from different users)
- `shared_content_id` links to pre-processed content (saves AI costs)

**Document Deduplication Logic:**

1. **Hash Generation**: Generate SHA-256 hash of PDF file content (not filename)
2. **Check Existing**: Query `documents` table by `content_hash`
3. **If Hash Exists**:
   - Link to existing `shared_document_content` (if available)
   - Clone extracted topics/flashcards/etc to user's document
   - Skip AI processing (saves time and cost)
4. **If Hash New**:
   - Process with AI
   - Store extracted content in `shared_document_content`
   - Link other users' documents to this shared content

**Privacy Considerations:**

- Users still own their document record (RLS enforced)
- Each user gets their own copy of extracted content (can edit)
- Shared content is anonymous (no user attribution)
- Original PDF files remain private (stored per user)

---

### 4. `topics`

**Purpose**: Identified concepts/themes from documents

```sql
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
```

**Why separate topics table:**

- Enables topic-based navigation (reduces cognitive load vs. page-by-page)
- Supports spaced repetition per topic
- Allows users to focus on weak areas

---

### 5. `flashcards`

**Purpose**: Study cards with spaced repetition data

```sql
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
```

**Why versioning:**

- Allows AI to improve cards without breaking user progress
- Users can opt into new versions
- Tracks content evolution

---

### 6. `exam_questions`

**Purpose**: Practice questions (MCQ, short answer, true/false, essay)

```sql
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
```

**Why flexible question types:**

- Supports diverse assessment methods
- JSONB `options` allows MCQ without rigid schema
- `explanation` supports learning, not just testing

---

### 7. `vocabulary_terms`

**Purpose**: Key terms with etymology, pronunciation, definitions

```sql
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
```

**Why etymology and pronunciation:**

- Deep understanding > memorization (learning science principle)
- Context sentences anchor meaning to original document

---

### 8. `concept_explanations`

**Purpose**: ELI5 → Advanced explanations for concepts

```sql
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
```

**Why multiple explanation levels:**

- Supports progressive disclosure (reduces cognitive load)
- Users can build understanding incrementally
- Matches learning science: scaffold from simple to complex

---

### 9. `user_progress`

**Purpose**: Track learning progress with spaced repetition

```sql
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
```

**Why separate progress table:**

- Decouples content from user state (allows content updates without losing progress)
- Supports multiple users studying same content (future community features)
- Enables efficient spaced repetition queries

**Spaced Repetition Logic (SM-2 algorithm):**

- `ease_factor`: Adjusts based on performance
- `interval_days`: Increases with mastery
- `next_review_at`: Calculated from last review + interval

---

### 10. `user_notes`

**Purpose**: Personal notes per topic

```sql
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
```

**Why one note per topic:**

- Reduces decision paralysis (where do I write this?)
- Encourages synthesis over fragmentation
- Simpler UI (one note field per topic)

---

### 11. `shared_document_content`

**Purpose**: Store extracted content from documents that can be reused across users (deduplication)

```sql
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
```

**Why this structure:**

- Stores extracted content once (topics, flashcards, questions, vocabulary)
- `content_hash` links to `documents.content_hash` for fast lookup
- `usage_count` tracks how many users benefit from shared processing
- `processing_version` allows re-processing with improved AI models
- Anonymous (no user attribution) for privacy

**Content Cloning Strategy:**

When a user uploads a document with an existing `content_hash`:

1. **Find shared content**: Query `shared_document_content` by hash
2. **Clone topics**: Create new `topics` records linked to user's `document_id`
3. **Clone flashcards**: Create new `flashcards` records linked to cloned topics
4. **Clone questions**: Create new `exam_questions` records linked to cloned topics
5. **Clone vocabulary**: Create new `vocabulary_terms` records linked to user's document
6. **Clone explanations**: Create new `concept_explanations` records linked to cloned topics
7. **Link document**: Set `documents.shared_content_id` to shared content
8. **Increment usage**: Update `shared_document_content.usage_count`

**Privacy & Ownership:**

- Users get their own copies of all content (can edit freely)
- Shared content is anonymous (no user data stored)
- Original PDFs remain private (stored per user)
- RLS ensures users only see their own cloned content

**RLS Policy:**

```sql
-- Shared content is read-only for authenticated users (for cloning)
ALTER TABLE shared_document_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read shared content" ON shared_document_content
  FOR SELECT USING (auth.role() = 'authenticated');

-- Note: INSERT/UPDATE handled by service role (bypasses RLS) or database functions
```

**Why read-only for users:**

- Users can read shared content to clone it
- Only system (service role or database functions) can create/update shared content
- Prevents users from modifying shared content (affects others)
- Service role bypasses RLS automatically (no policy needed)

---

### 12. `subscriptions`

**Purpose**: User subscription status and billing information

```sql
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
```

**Why this structure:**

- `status` tracks subscription lifecycle (trial → active → cancelled)
- `subscription_tier` determines pricing (base or 2x for medical)
- `country_code` and `currency` stored for pricing calculation
- `cancel_at_period_end` allows graceful cancellation (access until period ends)
- `payment_provider_customer_id` links to Stripe/Flutterwave/Paystack

**Subscription Status Flow:**

- `trial`: Free 7-day trial (no payment required)
- `active`: Paid subscription, current period
- `past_due`: Payment failed, 7-day grace period
- `cancelled`: User cancelled, access until `current_period_end`
- `expired`: Subscription ended, no access

---

### 13. `payments`

**Purpose**: Payment transaction history and tracking

```sql
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
```

**Why this structure:**

- Tracks all payment attempts (successful and failed)
- Links to subscription for billing history
- Stores provider payment ID for reconciliation
- `failure_reason` helps diagnose payment issues
- `metadata` JSONB allows provider-specific data (Stripe vs Flutterwave)

**Payment Status Flow:**

- `pending`: Payment initiated, awaiting confirmation
- `succeeded`: Payment completed successfully
- `failed`: Payment failed (card declined, insufficient funds, etc.)
- `refunded`: Payment was refunded (full or partial)

---

## Phase 2: Community Tables (Designed but not implemented)

### 14. `study_communities`

**Purpose**: Opt-in learning communities

```sql
CREATE TABLE study_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  topic_focus TEXT, -- e.g., "Machine Learning", "History 101"
  is_public BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(name) -- Prevent duplicate community names
);

CREATE INDEX idx_study_communities_creator ON study_communities(creator_id);
CREATE INDEX idx_study_communities_public ON study_communities(is_public) WHERE is_public = true;
```

---

### 15. `community_members`

**Purpose**: Many-to-many relationship between users and communities

```sql
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES study_communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- member, moderator, creator
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(community_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('member', 'moderator', 'creator'))
);

CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_community_members_community ON community_members(community_id);
```

---

### 16. `shared_study_packs`

**Purpose**: Cloneable study content from community members

```sql
CREATE TABLE shared_study_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES study_communities(id) ON DELETE SET NULL, -- NULL = public pack
  title TEXT NOT NULL,
  description TEXT,
  source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL, -- Original document if applicable
  clone_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT attribution_required CHECK (
    (source_document_id IS NOT NULL) OR (creator_id IS NOT NULL)
  )
);

CREATE INDEX idx_shared_study_packs_creator ON shared_study_packs(creator_id);
CREATE INDEX idx_shared_study_packs_community ON shared_study_packs(community_id);
```

---

### 17. `shared_pack_content`

**Purpose**: Links shared packs to flashcards, questions, etc.

```sql
CREATE TABLE shared_pack_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES shared_study_packs(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- flashcard, exam_question, vocabulary_term
  original_content_id UUID NOT NULL, -- Reference to original content
  cloned_content_id UUID, -- User's cloned version (if they customize)
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_content_type CHECK (content_type IN ('flashcard', 'exam_question', 'vocabulary_term'))
);

CREATE INDEX idx_shared_pack_content_pack ON shared_pack_content(pack_id);
```

---

### 18. `peer_explanations`

**Purpose**: Community explanations with clarity ratings

```sql
CREATE TABLE peer_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES shared_study_packs(id) ON DELETE CASCADE,
  explanation_text TEXT NOT NULL,
  explanation_level TEXT NOT NULL, -- eli5, beginner, intermediate, advanced
  clarity_rating DECIMAL(3,2), -- Average of user ratings
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_level CHECK (explanation_level IN ('eli5', 'beginner', 'intermediate', 'advanced'))
);

CREATE INDEX idx_peer_explanations_author ON peer_explanations(author_id);
CREATE INDEX idx_peer_explanations_topic ON peer_explanations(topic_id);
```

---

## Storage Buckets (Supabase Storage)

### `documents`

- **Path**: `{user_id}/{document_id}/original.pdf`
- **RLS**: Users can only access their own files
- **Purpose**: Original PDF uploads

### `avatars` (Phase 2)

- **Path**: `{user_id}/avatar.{ext}`
- **RLS**: Public read, user write
- **Purpose**: User profile images

---

## Database Functions & Triggers

### Auto-update `updated_at` timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Increment community member count

```sql
CREATE OR REPLACE FUNCTION increment_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE study_communities
  SET member_count = member_count + 1
  WHERE id = NEW.community_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_member_count AFTER INSERT ON community_members
  FOR EACH ROW EXECUTE FUNCTION increment_community_member_count();
```

### Increment shared content usage count

```sql
CREATE OR REPLACE FUNCTION increment_shared_content_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if shared_content_id is set (document is using shared content)
  IF NEW.shared_content_id IS NOT NULL THEN
    UPDATE shared_document_content
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = NEW.shared_content_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_shared_content_usage AFTER INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION increment_shared_content_usage();
```

**Why this trigger:**

- Automatically tracks how many users benefit from shared processing
- Useful for analytics (cost savings, popular documents)
- Updates `updated_at` for cache invalidation

---

## Indexing Strategy

**Why these indexes:**

- User-scoped queries are fast (all tables indexed by `user_id` or via document relationship)
- Spaced repetition queries use `next_review_at` index
- Full-text search on topics and vocabulary for discovery
- Composite indexes support common query patterns

---

## Migration Strategy

1. **Phase 1**: Create core tables (1-13: learning content + deduplication + subscriptions)
2. **Phase 2**: Add community tables (14-18) when ready
3. **Versioning**: Use `version` columns to track AI content evolution
4. **Backwards compatibility**: Never drop columns, only add (or mark deprecated)

---

## Security Considerations

- **RLS on all tables**: Zero-trust model
- **Cascade deletes**: User deletion removes all associated data (privacy)
- **Storage RLS**: Files are private by default
- **No public read access**: Even community content requires membership
