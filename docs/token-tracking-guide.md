# Token Tracking & Credit Pricing Guide

## Overview

The token tracking system automatically captures AI token usage for every operation, allowing you to:
- Track actual costs per operation
- Calculate optimal credit pricing
- Analyze cost efficiency
- Set appropriate markup

## Setup

### 1. Run the Token Tracking Migration

```bash
psql -h your-supabase-host -U postgres -d your-database -f database/migrations/006_add_token_tracking.sql
```

This creates:
- `ai_operation_tokens` table - stores token usage per operation
- Token usage fields in `document_processing_jobs`
- Cost calculation functions
- Analytics views

### 2. Verify Token Tracking

After processing a document, check token usage:

```sql
-- View token usage for a document
SELECT * FROM document_token_usage WHERE document_id = 'your-doc-id';

-- View token usage by operation type
SELECT * FROM token_usage_summary;
```

## How Token Tracking Works

### Automatic Tracking

Every AI operation automatically tracks:
- **Prompt tokens** - Input tokens sent to AI
- **Completion tokens** - Output tokens from AI
- **Total tokens** - Sum of both
- **Estimated cost** - Calculated based on model pricing
- **Operation type** - Which operation (topics, flashcards, etc.)

### Cost Calculation

The system uses approximate pricing (update in `calculate_token_cost` function):

| Model | Input (per 1M) | Output (per 1M) |
|-------|---------------|-----------------|
| Claude 3.5 Sonnet | $3 | $15 |
| Claude 3 Opus | $15 | $75 |
| GPT-4 | $30 | $60 |
| GPT-3.5 | $0.5 | $1.5 |

**Update pricing** in `006_add_token_tracking.sql` to match OpenRouter's current rates.

## Calculating Credit Markup

### Step 1: Analyze Token Costs

```typescript
import { getTokenUsageSummary, getCostEfficiencyMetrics } from '@/lib/token-analytics'

// Get average cost per operation
const { stats } = await getTokenUsageSummary()
// stats shows avg_cost_per_operation for each type

// Get overall cost efficiency
const metrics = await getCostEfficiencyMetrics()
// metrics.averageCostPerCredit shows your cost per credit
```

### Step 2: Determine Markup

**Example Calculation:**

If processing a document costs:
- **Token cost**: $0.10 USD
- **Current credit charge**: 50 credits
- **Credit value**: $0.01 per credit = $0.50 revenue
- **Profit margin**: ($0.50 - $0.10) / $0.10 = 400%

**Recommended Markup:**
- **3x markup** = 200% profit margin (good balance)
- **5x markup** = 400% profit margin (higher margin)
- **2x markup** = 100% profit margin (lower margin, more competitive)

### Step 3: Adjust Credit Pricing

Update credit costs in `estimateDocumentCredits()`:

```typescript
// In src/lib/credits.ts
export function estimateDocumentCredits(...) {
  // Adjust these multipliers based on actual token costs
  const processing = Math.floor(pageCount * complexityMultiplier[complexity])
  const flashcards = estimatedTopics * 2  // Adjust based on avg token cost
  const questions = estimatedTopics * 3   // Adjust based on avg token cost
  // etc.
}
```

## Viewing Token Analytics

### In Code

```typescript
import { 
  getTokenUsageSummary,
  getDocumentTokenUsage,
  getProcessingJobTokenUsage,
  getCostEfficiencyMetrics 
} from '@/lib/token-analytics'

// Summary by operation type
const summary = await getTokenUsageSummary()
console.log('Avg cost per flashcard:', summary.stats.find(s => s.operationType === 'generate_flashcards')?.avgCostPerOperation)

// Cost efficiency
const metrics = await getCostEfficiencyMetrics()
console.log('Average cost per credit:', metrics.averageCostPerCredit)
console.log('Markup percentage:', metrics.markupPercentage)
```

### In Database

```sql
-- Token usage summary
SELECT * FROM token_usage_summary;

-- Cost per operation type
SELECT 
  operation_type,
  AVG(estimated_cost_usd) as avg_cost,
  AVG(total_tokens) as avg_tokens
FROM ai_operation_tokens
GROUP BY operation_type;

-- Documents with highest costs
SELECT 
  document_title,
  total_cost_usd,
  credits_charged,
  (credits_charged * 0.01) / NULLIF(total_cost_usd, 0) as markup_ratio
FROM document_token_usage
ORDER BY total_cost_usd DESC;
```

## Recommended Pricing Strategy

### Based on Token Costs

1. **Calculate average token cost per operation**
   ```sql
   SELECT 
     operation_type,
     AVG(estimated_cost_usd) as avg_cost_usd
   FROM ai_operation_tokens
   GROUP BY operation_type;
   ```

2. **Set credit cost = token cost × markup multiplier**
   - Example: $0.02 cost × 3x = 6 credits ($0.06)

3. **Adjust multipliers in `estimateDocumentCredits()`**
   - Use actual averages from your data
   - Round up to be safe (always round in user's favor for estimates)

### Example Pricing Table

Based on average token costs:

| Operation | Avg Token Cost | 3x Markup | Credits |
|-----------|----------------|-----------|---------|
| Extract Topics | $0.05 | $0.15 | 15 |
| Generate Flashcards | $0.02 | $0.06 | 6 |
| Generate Questions | $0.03 | $0.09 | 9 |
| Generate Explanations | $0.02 | $0.06 | 6 |
| Generate Vocabulary | $0.01 | $0.03 | 3 |

**Update these in your credit estimation function based on your actual data.**

## Monitoring & Optimization

### Key Metrics to Track

1. **Average Cost Per Credit**
   - Should be < $0.01 (if credits = $0.01 each)
   - Lower is better

2. **Markup Percentage**
   - Target: 200-400% (3-5x markup)
   - Adjust if too low or too high

3. **Cost Per Operation Type**
   - Identify expensive operations
   - Optimize prompts to reduce tokens

### Regular Review

Run monthly analysis:

```sql
-- Monthly cost analysis
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(estimated_cost_usd) as total_cost,
  COUNT(DISTINCT document_id) as documents_processed,
  AVG(estimated_cost_usd) as avg_cost_per_doc
FROM ai_operation_tokens
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

## Updating Pricing

When OpenRouter pricing changes:

1. **Update `calculate_token_cost()` function** in database
2. **Recalculate costs** for existing records (optional)
3. **Adjust credit multipliers** in `estimateDocumentCredits()`

## Best Practices

1. **Always round up** credit estimates (user-friendly)
2. **Monitor actual vs estimated** costs regularly
3. **Adjust pricing** based on real data, not assumptions
4. **Track markup percentage** to ensure profitability
5. **Update pricing** when AI model costs change

## Example: Setting Up Pricing

```typescript
// After processing 100 documents, analyze:
const metrics = await getCostEfficiencyMetrics()
// If averageCostPerCredit = $0.003 (3 cents per credit)
// And you charge $0.01 per credit
// Markup = ($0.01 - $0.003) / $0.003 = 233% ✅ Good!

// If averageCostPerCredit = $0.008 (8 cents per credit)
// And you charge $0.01 per credit
// Markup = ($0.01 - $0.008) / $0.008 = 25% ❌ Too low!
// Solution: Increase credit costs or reduce AI costs
```

## Next Steps

1. Run the migration
2. Process a few test documents
3. Analyze token usage data
4. Calculate optimal credit pricing
5. Update `estimateDocumentCredits()` with real averages
6. Monitor and adjust monthly

