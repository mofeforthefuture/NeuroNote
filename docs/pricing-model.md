# Pricing & Subscription Model

## Design Philosophy

**Why this pricing structure:**
- **Accessibility**: Lower price for Nigerian users (5k NGN ≈ $3-4 USD) makes platform accessible
- **Fair pricing**: Medical field users pay double (reflecting higher value/income potential)
- **Transparent**: Clear, simple pricing reduces decision fatigue
- **No hidden fees**: What you see is what you pay

**UX Psychology:**
- **Fairness**: Location-based pricing acknowledges economic differences
- **Value alignment**: Medical field pricing reflects specialized use case
- **Simplicity**: One price, no tiers, no confusion

---

## Pricing Structure

### Base Subscription Fees

| User Location | Base Price | Currency |
|--------------|------------|----------|
| Nigeria | 5,000 | NGN (Nigerian Naira) |
| All Other Countries | $5 | USD |

### Medical Field Multiplier

Users in the medical field pay **2x** the base price:

| User Location | Medical Field Price | Currency |
|--------------|---------------------|----------|
| Nigeria (Medical) | 10,000 | NGN |
| All Other Countries (Medical) | $10 | USD |

---

## Subscription Details

### Billing Cycle
- **Monthly subscription** (recurring)
- **Auto-renewal** (can be cancelled anytime)
- **No annual discounts** (keeps pricing simple)

**Why monthly:**
- Lower commitment barrier (reduces anxiety)
- Users can cancel if not finding value
- Simpler than annual (no prorating, no refunds)

### Payment Methods
- **Nigeria**: Bank transfer, card, mobile money (Flutterwave/Paystack)
- **International**: Card (Stripe), PayPal

---

## Location Detection

### How Location is Determined

1. **IP-based detection** (initial)
   - Uses geolocation API (e.g., MaxMind, ipapi.co)
   - Detects country on signup

2. **User confirmation** (optional)
   - Users can manually select country if detection is wrong
   - Stored in `user_profiles.country_code`

3. **Payment method** (verification)
   - Payment method country must match detected country
   - Prevents pricing manipulation

**Why IP + confirmation:**
- IP detection is fast (no user input needed)
- User confirmation prevents errors
- Payment method provides verification layer

---

## Medical Field Detection

### How Medical Field Status is Determined

1. **Self-declaration** (primary)
   - Checkbox during signup: "I work in the medical field"
   - Optional field (users can opt-in to higher pricing)

2. **Verification** (optional, future)
   - Email domain verification (e.g., @hospital.com)
   - License number verification (optional)
   - Document upload (optional, for discounts/verification)

**Why self-declaration first:**
- Reduces friction (no verification needed upfront)
- Trust-based system (most users are honest)
- Can add verification later if abuse detected

**Medical Field Definition:**
- Doctors, nurses, medical students
- Healthcare professionals
- Medical researchers
- Anyone studying/working in healthcare

---

## Free Trial (Recommended)

### Trial Structure
- **7 days free** (no credit card required)
- **Full access** during trial
- **Auto-converts** to paid after trial (with clear notification)

**Why free trial:**
- Reduces signup friction
- Users can experience value before paying
- Higher conversion rates

**UX Considerations:**
- Clear trial countdown (not stressful, just informative)
- Easy cancellation (no dark patterns)
- Reminder 2 days before trial ends (not pushy)

---

## Pricing in User Journey

### When Users See Pricing

#### Stage 0: Landing Page
- **No pricing shown** (reduces friction)
- Focus on value proposition
- "Start Free Trial" button

**Why hide pricing initially:**
- Reduces decision paralysis
- Users experience value first
- Pricing shown when relevant (after trial)

#### Stage 1: Signup
- **Optional**: "Are you in the medical field?" checkbox
- **Location detected automatically**
- **No pricing shown yet** (still in trial)

#### Stage 2: Trial Period
- **Trial indicator**: "7 days remaining" (subtle, not stressful)
- **No payment prompts** during trial
- **Full access** to all features

#### Stage 3: Trial Ending (Day 5-6)
- **Gentle reminder**: "Your trial ends in 2 days"
- **Pricing shown**: Clear, simple, location-based
- **Payment screen**: One-click subscription

**Why show pricing at trial end:**
- Users have experienced value
- Context makes pricing feel fair
- Reduces abandonment (users are invested)

#### Stage 4: Subscription Active
- **Billing info**: Accessible in settings
- **Next billing date**: Shown clearly
- **Cancel anytime**: Easy, no guilt

---

## Database Schema Updates

### New Tables Required

See `database-schema.md` for full schema. Key additions:

1. **`subscriptions`** table
   - User subscription status
   - Billing cycle, next billing date
   - Payment method reference

2. **`payments`** table
   - Payment history
   - Transaction IDs
   - Refund tracking

3. **`user_profiles`** updates
   - `country_code` (ISO 3166-1 alpha-2)
   - `is_medical_field` (boolean)
   - `subscription_tier` (computed: base or medical)

---

## Pricing Calculation Logic

### Server-Side Function

```typescript
// Pseudo-code for pricing calculation
function calculatePrice(user: UserProfile): Price {
  const basePrice = user.country_code === 'NG' 
    ? { amount: 5000, currency: 'NGN' }
    : { amount: 5, currency: 'USD' };
  
  const multiplier = user.is_medical_field ? 2 : 1;
  
  return {
    amount: basePrice.amount * multiplier,
    currency: basePrice.currency,
    period: 'month',
  };
}
```

**Why server-side:**
- Prevents client-side manipulation
- Single source of truth
- Easier to update pricing

---

## Payment Processing

### Payment Providers

- **Nigeria**: Flutterwave or Paystack
  - Support for NGN
  - Local payment methods (bank transfer, mobile money)
  - Lower fees for local transactions

- **International**: Stripe
  - Global card support
  - USD and other currencies
  - Reliable, well-documented

**Why multiple providers:**
- Flutterwave/Paystack better for Nigeria (local methods, lower fees)
- Stripe better for international (global reach)
- Reduces payment friction

---

## Subscription Management

### User Controls

- **Cancel subscription**: One click, immediate (no guilt)
- **Resume subscription**: Easy reactivation
- **Change payment method**: Update card/bank details
- **View billing history**: Transparent, downloadable

**Why easy cancellation:**
- Builds trust (no dark patterns)
- Users can return if they want
- Reduces support burden (no "how do I cancel?")

### Grace Period

- **7 days grace** after failed payment
- **Access maintained** during grace period
- **Clear notifications**: "Payment failed, update your method"
- **Auto-suspend** after grace period (not deleted, just suspended)

**Why grace period:**
- Prevents accidental loss of access
- Gives users time to fix payment issues
- Reduces churn from payment failures

---

## Pricing Display Rules

### UI Guidelines

1. **Show currency symbol**: ₦5,000 or $5 (not just numbers)
2. **Show period**: "per month" (clear, not hidden)
3. **Medical field**: "Medical professionals: ₦10,000/month" (separate, clear)
4. **No comparison tables**: Simple, not overwhelming
5. **No "best value" badges**: No pressure, just information

**Why these rules:**
- Transparency reduces anxiety
- Clear information prevents confusion
- No pressure tactics (aligns with calm design)

---

## Future Considerations

### Potential Additions (Not Initial)

- **Student discounts**: 50% off for verified students
- **Annual plans**: Optional, with discount
- **Team plans**: For institutions (Phase 2)
- **Usage-based limits**: Free tier with limits (if needed)

**Why not initial:**
- Keeps pricing simple (reduces cognitive load)
- Can add later based on user feedback
- Focus on core value first

---

## Success Metrics

### Pricing Health Indicators

- **Conversion rate**: Trial → paid subscription
- **Churn rate**: Monthly cancellation rate
- **Payment failure rate**: Failed payments / total payments
- **Medical field adoption**: % of users selecting medical field

**Why these metrics:**
- Measure pricing effectiveness
- Identify payment issues early
- Understand user segments

---

## Design Principles Applied

1. **Transparency**: Clear pricing, no hidden fees
2. **Fairness**: Location-based pricing acknowledges economic differences
3. **Simplicity**: One price, no confusing tiers
4. **No pressure**: Easy cancellation, no guilt
5. **Trust**: Self-declaration for medical field (trust-based)

**Every pricing decision must:**
- Feel fair to users
- Reduce anxiety, not increase it
- Support the learning mission (not distract from it)

