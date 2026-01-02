# Study Credits System - Implementation Guide

## 🚀 Quick Start

### 1. Run Database Migration

```bash
# Apply the credits system migration
psql -h your-supabase-host -U postgres -d your-database -f database/migrations/005_create_credits_system.sql
```

Or use Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `005_create_credits_system.sql`
3. Run the migration

### 2. Verify Migration

Check that tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_credits', 'credit_transactions', 'credit_packages', 'document_processing_jobs');
```

### 3. Test Credit Functions

```sql
-- Test getting balance (replace with actual user_id)
SELECT get_user_credit_balance('user-uuid-here');

-- Test adding credits
SELECT add_credits_to_user(
  'user-uuid-here',
  100,
  'bonus',
  'Welcome bonus',
  NULL,
  NULL,
  '{}'::jsonb
);
```

## 📋 Component Usage

### Credit Balance Display

```tsx
import { CreditBalance } from '@/components/credits/credit-balance'

<CreditBalance
  showDetails={true}
  onBuyClick={() => setShowBuyModal(true)}
  onHistoryClick={() => navigate('/credits/history')}
/>
```

### Credit Estimate (Before Processing)

```tsx
import { CreditEstimate } from '@/components/credits/credit-estimate'
import { estimateDocumentCredits } from '@/lib/credits'

const estimate = estimateDocumentCredits(pageCount, estimatedTopics, 'medium')

<CreditEstimate
  estimate={estimate}
  currentBalance={userBalance}
/>
```

### Buy Credits Modal

```tsx
import { BuyCreditsModal } from '@/components/credits/buy-credits-modal'

<BuyCreditsModal
  open={showModal}
  onOpenChange={setShowModal}
  onPurchase={async (packageId) => {
    // Handle purchase (integrate with payment provider)
    await handlePayment(packageId)
  }}
/>
```

## 🔧 Backend Integration

### Check Balance Before Processing

```typescript
import { getCreditBalance, createProcessingJob } from '@/lib/credits'

const { balance, error } = await getCreditBalance(userId)
if (balance && balance.balance < estimatedCredits) {
  // Show insufficient credits error
  return { error: 'Insufficient credits' }
}
```

### Create Processing Job

```typescript
const { jobId, error } = await createProcessingJob(
  userId,
  documentId,
  estimatedCredits,
  'initial',
  { page_count: 50, complexity: 'medium' }
)
```

### Update Job After Processing

```typescript
import { updateProcessingJob } from '@/lib/credits'

// On success
await updateProcessingJob(jobId, actualCreditsUsed, 'completed')

// On failure (automatic refund)
await updateProcessingJob(jobId, 0, 'failed', errorMessage)
```

## 💳 Payment Integration

### Stripe Integration (Example)

```typescript
// In buy-credits-modal.tsx or payment service
import { loadStripe } from '@stripe/stripe-js'

async function handlePurchase(packageId: string) {
  // 1. Create payment intent on backend
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ packageId }),
  })
  
  const { clientSecret } = await response.json()
  
  // 2. Confirm payment with Stripe
  const stripe = await loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY!)
  const result = await stripe!.confirmCardPayment(clientSecret)
  
  // 3. On success, add credits
  if (result.paymentIntent?.status === 'succeeded') {
    await addCreditsToUser(userId, package.credits + package.bonusCredits)
  }
}
```

### Flutterwave Integration (Nigeria)

```typescript
// Similar flow with Flutterwave SDK
import { useFlutterwave } from 'flutterwave-react-v3'

const config = {
  public_key: process.env.VITE_FLW_PUBLIC_KEY!,
  tx_ref: Date.now().toString(),
  amount: package.priceAmount,
  currency: 'NGN',
  payment_options: 'card,mobilemoney,ussd',
  customer: {
    email: user.email,
    name: user.name,
  },
  customizations: {
    title: 'Buy Study Credits',
    description: package.name,
  },
}

const handleFlutterPayment = useFlutterwave(config)

// On payment success callback
handleFlutterPayment({
  callback: async (response) => {
    if (response.status === 'successful') {
      await addCreditsToUser(userId, package.credits + package.bonusCredits)
    }
  },
  onClose: () => {},
})
```

## 🎨 UI Integration Points

### Header/Navigation

Add credit balance to header:
```tsx
// In header.tsx or app-shell.tsx
<CreditBalance 
  showDetails={false}
  onBuyClick={() => setShowBuyModal(true)}
/>
```

### Settings Page

Add credit management section:
```tsx
// In settings.tsx
<div className="space-y-4">
  <CreditBalance showDetails={true} />
  <Button onClick={() => navigate('/credits/history')}>
    View Credit History
  </Button>
  <Button onClick={() => setShowBuyModal(true)}>
    Buy More Credits
  </Button>
</div>
```

## 📊 Monitoring & Analytics

### Track Key Metrics

```sql
-- Credit purchase rate
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as purchases,
  SUM(amount) as total_credits_purchased
FROM credit_transactions
WHERE transaction_type = 'purchase'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Average credits per document
SELECT 
  AVG(actual_credits) as avg_credits_per_doc,
  AVG(estimated_credits) as avg_estimated_credits
FROM document_processing_jobs
WHERE status = 'completed'
AND actual_credits IS NOT NULL;

-- Refund rate
SELECT 
  COUNT(*) FILTER (WHERE status = 'refunded') * 100.0 / COUNT(*) as refund_rate
FROM document_processing_jobs;
```

## 🔒 Security Considerations

1. **RLS Policies**: All credit tables have RLS enabled - users can only see their own data
2. **Transaction Safety**: Credit operations use database transactions to prevent race conditions
3. **Balance Verification**: `balance_after` field in transactions allows auditing
4. **Server-Side Validation**: Always validate credit operations on the backend

## 🐛 Troubleshooting

### Credits Not Deducting

1. Check RLS policies are correct
2. Verify user has credits record (auto-created on signup)
3. Check database functions are installed correctly
4. Review transaction logs in `credit_transactions`

### Refunds Not Working

1. Verify `updateProcessingJob` is called on failure
2. Check refund transaction is created
3. Verify balance is updated correctly

### Balance Not Updating

1. Check `user_credits` table has correct RLS policies
2. Verify database functions have `SECURITY DEFINER`
3. Check transaction logs for errors

## 📝 Next Steps

1. **Payment Integration**: Connect Stripe/Flutterwave
2. **Credit History Page**: Create `/credits/history` route
3. **Email Notifications**: Notify users of low balance
4. **Free Credits**: Add welcome bonus for new users
5. **Analytics Dashboard**: Track credit usage patterns

## 🎯 Testing Checklist

- [ ] User can view credit balance
- [ ] Credit estimate shows before processing
- [ ] Credits are deducted on processing
- [ ] Credits are refunded on failure
- [ ] Low balance warning appears
- [ ] Buy credits modal works
- [ ] Credit history displays correctly
- [ ] RLS policies prevent cross-user access
- [ ] Transactions are logged correctly

