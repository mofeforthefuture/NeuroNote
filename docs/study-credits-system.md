# Study Credits System - Complete Design

## 🧠 Design Philosophy

**Core Principles:**
- **Transparency**: Every credit deduction is visible and explained
- **Fairness**: Users only pay for AI processing, never for studying
- **Trust**: No hidden costs, no surprise deductions
- **Empowerment**: Users control when credits are spent
- **Clarity**: Simple math, human-readable explanations

**Psychological Goals:**
- Reduce anxiety about AI costs
- Make learning feel safe and uninterrupted
- Build trust through transparency
- Encourage exploration, not hoarding

---

## 1️⃣ Credit Model & Pricing

### Base Credit Unit

**1 Study Credit = 1 page of PDF processing**

This simple unit makes costs predictable and easy to understand.

### Credit Consumption Rules

#### ✅ Credits ARE Consumed By:

1. **PDF Processing** (Initial Upload)
   - **Base cost**: 1 credit per page
   - **Complexity multiplier**: 
     - Simple document (text-heavy): 1x
     - Complex document (diagrams, equations): 1.5x
     - Very complex (images, tables, formulas): 2x
   - **Rounding**: Always rounds DOWN (user-friendly)
   - **Example**: 47-page document = 47 credits (not 50)

2. **AI Content Generation** (Per Topic)
   - **Flashcards**: 2 credits per topic
   - **Exam Questions**: 3 credits per topic
   - **Vocabulary Extraction**: 1 credit per document (flat rate)
   - **Concept Explanations**: 2 credits per topic (all 4 levels)

3. **On-Demand Regeneration**
   - **Regenerate flashcards**: 2 credits per topic
   - **Regenerate questions**: 3 credits per topic
   - **Regenerate explanations**: 2 credits per topic
   - **Regenerate vocabulary**: 1 credit per document

#### ❌ Credits are NOT Consumed By:

- Viewing/studying already-generated content
- Browsing topics
- Reviewing flashcards
- Answering practice questions
- Reading explanations
- Viewing vocabulary
- Progress tracking
- Any non-AI operations

### Credit Calculation Examples

**Example 1: Simple 20-page PDF**
- Processing: 20 pages × 1 credit = 20 credits
- Topics identified: 5
- Flashcards (5 topics × 2 credits) = 10 credits
- Questions (5 topics × 3 credits) = 15 credits
- Vocabulary (flat rate) = 1 credit
- Explanations (5 topics × 2 credits) = 10 credits
- **Total: 56 credits**

**Example 2: Complex 50-page PDF**
- Processing: 50 pages × 1.5 complexity = 75 credits
- Topics: 8
- Flashcards: 8 × 2 = 16 credits
- Questions: 8 × 3 = 24 credits
- Vocabulary: 1 credit
- Explanations: 8 × 2 = 16 credits
- **Total: 132 credits**

**Example 3: Document Deduplication (Hash Match)**
- Processing: 0 credits (content cloned, no AI needed)
- **Total: 0 credits** ✨

---

## 2️⃣ Database Schema

### Core Tables

#### `user_credits`
Tracks current credit balance per user.

```sql
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
```

**Indexes:**
- `idx_user_credits_user` on `user_id` (for fast lookups)

**RLS Policies:**
- Users can only view/update their own balance

#### `credit_transactions`
Full audit trail of all credit movements.

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive = earned, Negative = spent
  transaction_type TEXT NOT NULL, -- 'purchase', 'refund', 'processing', 'generation', 'bonus', 'gift'
  reference_type TEXT, -- 'document', 'topic', 'package', 'job'
  reference_id UUID, -- ID of related entity (document_id, topic_id, etc.)
  description TEXT NOT NULL, -- Human-readable description
  metadata JSONB DEFAULT '{}', -- Additional context (page_count, complexity, etc.)
  balance_after INTEGER NOT NULL, -- Balance after this transaction (for verification)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_transaction_type CHECK (
    transaction_type IN ('purchase', 'refund', 'processing', 'generation', 'bonus', 'gift', 'adjustment')
  )
);
```

**Indexes:**
- `idx_credit_transactions_user` on `user_id`
- `idx_credit_transactions_created` on `created_at DESC`
- `idx_credit_transactions_reference` on `(reference_type, reference_id)`

**RLS Policies:**
- Users can only view their own transactions

#### `credit_packages`
Available credit packages for purchase.

```sql
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "Starter Pack", "Student Bundle", etc.
  credits INTEGER NOT NULL, -- Number of credits in package
  price_amount DECIMAL(10,2) NOT NULL, -- Price in local currency
  price_currency TEXT NOT NULL DEFAULT 'USD', -- 'USD' or 'NGN'
  country_code TEXT, -- NULL = available everywhere, or specific country
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- For sorting in UI
  bonus_credits INTEGER DEFAULT 0, -- Extra credits (e.g., "Buy 100, get 20 free")
  description TEXT, -- Marketing description
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_currency CHECK (price_currency IN ('USD', 'NGN'))
);
```

**Indexes:**
- `idx_credit_packages_active` on `is_active, display_order`

**RLS Policies:**
- Public read access (anyone can see packages)

#### `document_processing_jobs`
Tracks credit consumption for document processing.

```sql
CREATE TABLE document_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estimated_credits INTEGER NOT NULL, -- Estimated before processing
  actual_credits INTEGER, -- Actual credits consumed (after processing)
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
```

**Indexes:**
- `idx_processing_jobs_document` on `document_id`
- `idx_processing_jobs_user` on `user_id`
- `idx_processing_jobs_status` on `status`

**RLS Policies:**
- Users can only view their own jobs

---

## 3️⃣ Credit Deduction Logic

### Pre-Processing Check

Before any AI operation:

1. **Estimate credits needed**
2. **Check user balance**
3. **If insufficient**: Show clear error, offer to purchase
4. **If sufficient**: Reserve credits (deduct immediately)
5. **Process document**
6. **If processing fails**: Refund credits automatically

### Transaction Safety

All credit operations use database transactions:

```typescript
// Pseudocode
async function deductCredits(userId, amount, description, metadata) {
  return await db.transaction(async (tx) => {
    // 1. Lock user_credits row (FOR UPDATE)
    const balance = await tx.query(
      'SELECT balance FROM user_credits WHERE user_id = $1 FOR UPDATE',
      [userId]
    )
    
    // 2. Check sufficient balance
    if (balance < amount) {
      throw new InsufficientCreditsError()
    }
    
    // 3. Deduct credits
    const newBalance = balance - amount
    await tx.query(
      'UPDATE user_credits SET balance = $1, updated_at = NOW() WHERE user_id = $2',
      [newBalance, userId]
    )
    
    // 4. Create transaction record
    await tx.query(
      'INSERT INTO credit_transactions (...) VALUES (...)',
      [userId, -amount, 'processing', description, newBalance, ...]
    )
    
    // 5. Create processing job record
    const jobId = await tx.query(
      'INSERT INTO document_processing_jobs (...) VALUES (...) RETURNING id',
      [...]
    )
    
    return { newBalance, jobId }
  })
}
```

### Refund Logic

If processing fails:

```typescript
async function refundCredits(jobId, reason) {
  return await db.transaction(async (tx) => {
    // 1. Get job details
    const job = await tx.query('SELECT * FROM document_processing_jobs WHERE id = $1', [jobId])
    
    // 2. Refund credits
    await tx.query(
      'UPDATE user_credits SET balance = balance + $1 WHERE user_id = $2',
      [job.actual_credits, job.user_id]
    )
    
    // 3. Create refund transaction
    await tx.query(
      'INSERT INTO credit_transactions (...) VALUES (...)',
      [job.user_id, job.actual_credits, 'refund', 'Processing failed', ...]
    )
    
    // 4. Update job status
    await tx.query(
      'UPDATE document_processing_jobs SET status = $1, refunded_at = NOW() WHERE id = $2',
      ['refunded', jobId]
    )
  })
}
```

---

## 4️⃣ UX & UI Design

### Visual Design Principles

**Colors:**
- **Primary credit color**: Soft blue (#4A90E2) - trustworthy, calm
- **Low balance warning**: Warm amber (#F5A623) - cautionary, not alarming
- **Critical balance**: Soft orange (#FF6B35) - attention, not panic
- **Success/earned**: Green (#52C41A) - positive reinforcement
- **Never use red** for low balance (too aggressive)

**Typography:**
- **Balance display**: Large, clear numbers (e.g., "247 Credits")
- **Cost estimates**: Medium weight, readable
- **Descriptions**: Smaller, secondary text

**Icons:**
- **Credits**: Coins or stars (academic, not casino)
- **Balance**: Circular progress indicator
- **Transactions**: List with clear icons per type

### Key Screens

#### 1. Credit Balance Display (Header/Profile)

```
┌─────────────────────────────────────┐
│  Study Credits                     │
│  ─────────────────────────────────  │
│                                     │
│  247 Credits                       │
│  ─────────────────────────────────  │
│  [View History]  [Buy Credits]     │
└─────────────────────────────────────┘
```

**Microcopy:**
- "You have 247 Study Credits"
- "Credits are only used when AI processes documents"
- "Studying is always free"

#### 2. PDF Upload Screen (Credit Estimate)

```
┌─────────────────────────────────────┐
│  Upload Document                   │
│                                     │
│  [Drag & Drop Zone]                │
│                                     │
│  📄 biology-textbook.pdf           │
│  47 pages • 2.3 MB                 │
│                                     │
│  Estimated Cost:                   │
│  ─────────────────────────────────  │
│  • Processing: ~47 credits         │
│  • Content generation: ~40 credits │
│  • Total: ~87 credits              │
│                                     │
│  Your balance: 247 credits ✓       │
│                                     │
│  [Cancel]  [Process Document]      │
└─────────────────────────────────────┘
```

**Microcopy:**
- "This will use approximately 87 Study Credits"
- "You have enough credits to proceed"
- "If processing fails, credits will be refunded"

#### 3. Low Credit Warning

```
┌─────────────────────────────────────┐
│  ⚠️ Low Credit Balance             │
│                                     │
│  You have 12 credits remaining.    │
│                                     │
│  This document will use ~87 credits │
│                                     │
│  [Buy More Credits]  [Cancel]      │
└─────────────────────────────────────┘
```

**Microcopy:**
- "You don't have enough credits for this document"
- "Buy credits to continue processing"
- "No pressure - you can always come back later"

#### 4. Buy Credits Modal

```
┌─────────────────────────────────────┐
│  Buy Study Credits                 │
│                                     │
│  Choose a package:                  │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ Starter  │  │ Student  │        │
│  │ 50       │  │ 200      │        │
│  │ $5       │  │ $15      │        │
│  │          │  │ +20 free │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  [Cancel]  [Continue to Payment]   │
└─────────────────────────────────────┘
```

**Microcopy:**
- "Credits never expire"
- "Only pay for what you use"
- "Studying is always free"

#### 5. Credit Usage History

```
┌─────────────────────────────────────┐
│  Credit History                    │
│                                     │
│  ─────────────────────────────────  │
│  Today                              │
│  • -87 credits                     │
│    Processed: biology-textbook.pdf │
│                                     │
│  Yesterday                          │
│  • -56 credits                     │
│    Processed: chemistry-notes.pdf  │
│  • +200 credits                    │
│    Purchased: Student Bundle       │
│                                     │
│  [Load More]                        │
└─────────────────────────────────────┘
```

**Microcopy:**
- Clear transaction descriptions
- Group by date
- Show balance after each transaction

#### 6. Processing Progress (With Credit Info)

```
┌─────────────────────────────────────┐
│  Processing Document                │
│                                     │
│  [Progress Bar: 65%]               │
│                                     │
│  Generating flashcards...          │
│                                     │
│  Credits used so far: 47           │
│  Estimated remaining: ~40           │
│                                     │
│  [Cancel Processing]                │
└─────────────────────────────────────┘
```

**Microcopy:**
- "Processing in progress..."
- "Credits are deducted as we go"
- "You can cancel anytime (partial refund)"

---

## 5️⃣ Fairness & Trust Features

### Credit Refund Policy

**Automatic Refunds:**
- Processing fails → Full refund
- Partial processing fails → Partial refund (proportional)
- User cancels → Refund for unprocessed content

**Manual Refunds:**
- Support can issue refunds for exceptional cases
- All refunds are logged in `credit_transactions`

### Transparency Features

#### "What Used My Credits?" Breakdown

```
Document: biology-textbook.pdf
─────────────────────────────────
Processing (47 pages):     47 credits
Flashcards (5 topics):      10 credits
Questions (5 topics):       15 credits
Vocabulary:                  1 credit
Explanations (5 topics):    10 credits
─────────────────────────────────
Total:                      83 credits
```

#### Credit Explanation Page

**URL**: `/credits/how-it-works`

**Content:**
- How credits work
- What costs credits vs. what's free
- How to estimate costs
- Refund policy
- FAQ

---

## 6️⃣ Extensibility (Future Features)

### Community Features

- **Shared content**: Users can share processed documents (credits earned by creator)
- **Creator rewards**: Users who share popular content earn credits
- **Credit gifting**: Users can gift credits to others

### Institutional Plans

- **School accounts**: Bulk credit purchases
- **Student discounts**: Verified students get bonus credits
- **Free monthly credits**: Starter pack for new users (e.g., 50 credits/month)

### Advanced Features

- **Credit subscriptions**: Monthly credit allowance
- **Usage analytics**: Show users their credit efficiency
- **Smart recommendations**: Suggest when to buy credits

---

## 7️⃣ Implementation Checklist

### Phase 1: Core System
- [ ] Database schema (migrations)
- [ ] Credit balance service
- [ ] Transaction logging
- [ ] Credit deduction logic
- [ ] Refund logic

### Phase 2: Document Processing Integration
- [ ] Credit estimation before processing
- [ ] Pre-processing balance check
- [ ] Credit deduction during processing
- [ ] Automatic refunds on failure

### Phase 3: UI Components
- [ ] Credit balance display
- [ ] Credit purchase modal
- [ ] Credit history page
- [ ] Low balance warnings
- [ ] Cost estimates in upload flow

### Phase 4: Trust & Transparency
- [ ] "How Credits Work" page
- [ ] Transaction breakdowns
- [ ] Usage analytics
- [ ] Refund request flow

### Phase 5: Payment Integration
- [ ] Credit package management
- [ ] Payment processing (Stripe/Flutterwave)
- [ ] Purchase confirmation
- [ ] Receipt generation

---

## 8️⃣ Success Metrics

### Trust Indicators
- **Refund rate**: Low refund rate = good processing quality
- **Credit purchase frequency**: Regular purchases = trust in system
- **Support tickets**: Few credit-related tickets = clear system

### Engagement Indicators
- **Credit utilization**: High usage = users find value
- **Balance hoarding**: Low hoarding = users trust they can buy more
- **Document processing rate**: More processing = more value

### Financial Health
- **Average credit purchase**: Size of typical purchase
- **Credit-to-revenue ratio**: Cost efficiency
- **Processing success rate**: High success = fewer refunds

---

## 9️⃣ Design Principles Summary

**Every decision must:**
1. ✅ Feel fair to users
2. ✅ Reduce anxiety, not increase it
3. ✅ Support learning, not distract from it
4. ✅ Build trust through transparency
5. ✅ Empower users with control

**Never:**
- ❌ Hide credit costs
- ❌ Use aggressive warnings
- ❌ Make users feel trapped
- ❌ Charge for studying
- ❌ Create dark patterns

---

## 🎯 Final Vision

Users should feel:
- **In control**: They know exactly what costs credits
- **Safe**: Credits are refunded if things go wrong
- **Empowered**: They can learn without worrying about costs
- **Trusting**: The system is transparent and fair

**The goal**: Users never think about credits except when they need to buy more. The system should feel invisible, fair, and supportive of learning.

