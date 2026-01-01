# User Journey Map: First Visit → Studying → Mastery

## Design Philosophy

**Why map the journey:**

- **Reduces anxiety**: Clear expectations at each stage prevent cognitive overload
- **Builds confidence**: Progressive disclosure matches learning science (scaffolding)
- **Prevents abandonment**: Each step must feel achievable, not overwhelming
- **Supports flow state**: Minimize friction between study actions

---

## Journey Stages

### Stage 0: Pre-Authentication (First Visit)

**User State**: Curious, possibly skeptical, low commitment

**Screen**: Landing / Welcome

- **Primary Action**: "Get Started" or "Upload Your First PDF"
- **No distractions**: No navigation menu, no feature list, no testimonials
- **Value proposition**: One clear sentence about transforming PDFs into a learning system
- **Visual**: Calm, minimal, dark-mode-first

**UX Psychology:**

- **Hick's Law**: One primary action reduces decision paralysis
- **Progressive disclosure**: Don't show everything upfront (reduces cognitive load)
- **Trust signals**: Privacy-first messaging ("Your documents stay private")

**Why this approach:**

- First impression sets tone for entire product
- Overwhelming landing pages increase bounce rate
- Users need to feel safe before committing

---

### Stage 1: Onboarding (First Session)

**User State**: Committed to trying, but needs guidance

#### Step 1.1: Account Creation

- **Minimal fields**: Email + password (or OAuth)
- **Location detection**: Auto-detected from IP (can be corrected if wrong)
- **Optional field**: "Are you in the medical field?" checkbox (self-declaration)
- **No pricing shown yet**: Focus on value, not cost
- **Immediate feedback**: "Account created" → smooth transition

**Why defer profile setup:**

- Reduces friction at critical moment (conversion)
- Users can customize later when they understand value
- Prevents decision fatigue

**Why optional medical field checkbox:**

- Self-declaration is trust-based (reduces friction)
- Can be verified later if needed
- Pricing calculated automatically based on location + medical field status

#### Step 1.2: First PDF Upload

- **Drag-and-drop zone**: Large, clear, impossible to miss
- **File validation**: Immediate feedback (size, format)
- **Processing indicator**: Clear status ("Processing your document...")
- **No queue yet**: One document at a time for first session

**UX Psychology:**

- **Affordance**: Large drop zone signals where to interact
- **Feedback loops**: Immediate validation prevents frustration
- **Progress visibility**: Processing indicator reduces anxiety

**Why one document:**

- Prevents overwhelming new users
- Allows focus on learning the system
- Can add batch upload later for power users

#### Step 1.3: Processing Wait

- **Status screen**: "Analyzing your document..." or "Preparing your document..." (if already processed)
- **What's happening**:
  - New document: "Identifying topics, extracting key concepts" (AI processing)
  - Existing document: "Setting up your study materials" (fast clone)
- **Estimated time**:
  - New document: 2-5 minutes (AI processing)
  - Existing document: 10-30 seconds (instant clone)
- **No distractions**: No ads, no "while you wait" content

**Why explain what's happening:**

- Reduces uncertainty (major source of anxiety)
- Sets expectations (users know if it's fast or slow)
- Builds trust in AI process

**Why show different messages:**

- Users understand why some documents process faster
- Transparency builds trust (not magic, just smart deduplication)
- Sets correct expectations (popular documents = instant)

#### Step 1.4: Document Ready

- **Success state**: "Your document is ready!"
- **Trial indicator**: Subtle "7 days free trial" badge (not stressful)
- **What you can do**: Brief intro to available features (topics, flashcards, questions)
- **Primary action**: "Start Exploring" or "View Topics"
- **Skip option**: "I'll explore later" (no pressure)

**Why offer skip:**

- Respects user autonomy
- Prevents overwhelming with information
- Users can discover features organically

**Why show trial indicator:**

- Sets expectations (transparency)
- Reduces anxiety (users know they have time)
- Not pushy, just informative

---

### Stage 2: Discovery (First Study Session)

**User State**: Curious, exploring, building mental model

#### Step 2.1: Document Overview

- **Layout**: Card-based, one document per card
- **Information hierarchy**:
  1. Document title (largest)
  2. Topic count (secondary)
  3. Progress indicator (subtle)
  4. Last studied date (tertiary)
- **Primary action**: "Open" or "Continue Studying"
- **No infinite scroll**: Pagination or "Load More" button

**Why card-based:**

- Visual separation reduces cognitive load
- Easy to scan
- Clear affordances (card = clickable)

**Why no infinite scroll:**

- Prevents endless browsing (addictive pattern)
- Encourages intentional study choices
- Reduces decision fatigue

#### Step 2.2: Topic Navigation

- **Layout**: List or grid of topics
- **Each topic shows**:
  - Title
  - Progress indicator (subtle)
  - Flashcard count
  - Question count
- **Filtering**: By mastery level (optional, hidden by default)
- **Primary action**: Click topic to study

**Why show counts:**

- Sets expectations (how much content)
- Helps users plan study sessions
- Transparent, not overwhelming

#### Step 2.3: Topic Detail View

- **Layout**: Single column, focused
- **Sections** (collapsible):
  1. Concept Explanation (ELI5 → Advanced selector)
  2. Flashcards
  3. Practice Questions
  4. Vocabulary
  5. Personal Notes
- **Primary action**: "Start Flashcards" or "Take Quiz"
- **Progress indicator**: Subtle, encouraging (not stressful)

**Why collapsible sections:**

- Reduces visual clutter
- Users focus on one learning mode at a time
- Progressive disclosure

**Why ELI5 → Advanced selector:**

- Matches learning science: start simple, build complexity
- Reduces cognitive load for beginners
- Supports mastery progression

---

### Stage 3: Active Study (Core Loop)

**User State**: Focused, in flow, learning

#### Step 3.1: Flashcard Session

- **Layout**: Full-screen card, minimal UI
- **Card design**:
  - Large, readable text
  - Flip animation (functional, not decorative)
  - No timer (removes pressure)
  - No streak counter (reduces anxiety)
- **Actions**: "Flip", "Got it", "Need practice"
- **Progress**: Subtle indicator (e.g., "3 of 12")

**UX Psychology:**

- **Flow state**: Full-screen removes distractions
- **No pressure**: No timers, no streaks (reduces anxiety)
- **Clear feedback**: "Got it" vs "Need practice" is binary (reduces decision fatigue)

**Why no timers:**

- Timers create pressure, not learning
- Users should study at their own pace
- Speed ≠ understanding

**Why no streaks:**

- Streaks create anxiety (fear of breaking streak)
- Can lead to addictive behavior
- Focus should be on learning, not gamification

#### Step 3.2: Spaced Repetition Logic

- **Behind the scenes**: SM-2 algorithm updates `next_review_at`
- **User sees**: "Review again in 3 days" (optional, subtle)
- **No pressure**: Users can review early if they want
- **Smart scheduling**: System suggests reviews when due

**Why SM-2 algorithm:**

- Proven effective for long-term retention
- Adapts to user performance
- Reduces over-reviewing (saves time)

#### Step 3.3: Practice Questions

- **Layout**: One question at a time, full focus
- **Question types**: Clear labels (MCQ, Short Answer, etc.)
- **Feedback**: Immediate after submission
  - Correct: Green, brief celebration
  - Incorrect: Red, explanation shown
- **No score display**: Progress is tracked, but not shown during session

**Why no score during session:**

- Scores create pressure and distraction
- Focus should be on learning, not performance
- Progress visible in separate "Progress" view

#### Step 3.4: Vocabulary Study

- **Layout**: Term card with definition, etymology, pronunciation
- **Audio**: Pronunciation playback (if available)
- **Context**: Example sentences from original document
- **Actions**: "Mark as learned", "Review later"

**Why include etymology:**

- Deep understanding > memorization
- Helps users make connections
- Supports long-term retention

---

### Stage 4: Progress & Reflection

**User State**: Checking progress, planning next session

#### Step 4.1: Progress Dashboard

- **Layout**: Overview cards, not detailed charts
- **Metrics shown**:
  - Topics mastered (encouraging, not stressful)
  - Upcoming reviews (helpful, not pressure)
  - Study streak (optional, can be hidden)
- **Visual**: Calm colors, no red/yellow stress indicators
- **Primary action**: "Continue Studying" or "Review Due Items"

**Why overview, not detailed:**

- Detailed charts can create anxiety
- Users need high-level view, not micromanagement
- Encourages, doesn't judge

**Why "upcoming reviews" not "overdue":**

- Positive framing reduces stress
- "Overdue" creates guilt and anxiety
- "Upcoming" feels like planning, not failure

#### Step 4.2: Topic Mastery View

- **Visualization**: Simple progress bars or mastery levels
- **Colors**: Green (mastered), blue (in progress), gray (not started)
- **No red**: Red signals failure, creates stress
- **Grouping**: By document or by subject

**Why no red:**

- Red is associated with danger/failure
- Creates negative emotions
- Blue/green are calmer, more encouraging

---

### Stage 4.5: Trial Ending & Subscription (Days 5-7)

**User State**: Trial expiring, deciding whether to subscribe

#### Step 4.5.1: Trial Reminder (Day 5-6)

- **Gentle notification**: "Your trial ends in 2 days" (not pushy)
- **Clear value recap**: "You've mastered X topics, reviewed Y flashcards"
- **No pressure**: Can dismiss, no popups
- **Access maintained**: Full access during reminder period

**Why gentle reminder:**

- Gives users time to decide
- Not pushy (builds trust)
- Focuses on value, not fear

#### Step 4.5.2: Pricing Screen (Day 6-7)

- **Layout**: Clean, simple, one price
- **Pricing display**:
  - Location-based: "₦5,000/month" or "$5/month"
  - Medical field: Separate line if applicable ("Medical professionals: ₦10,000/month")
  - Currency symbol always shown
- **No comparison tables**: Simple, not overwhelming
- **Payment methods**: Clear icons (card, bank transfer, etc.)
- **Primary action**: "Subscribe Now" (one click)
- **Secondary action**: "Cancel Trial" (easy, no guilt)

**Why show pricing at trial end:**

- Users have experienced value (context makes price feel fair)
- Reduces abandonment (users are invested)
- Clear, transparent pricing builds trust

**Why simple pricing display:**

- No confusing tiers (reduces cognitive load)
- Location-based pricing is transparent
- Medical field pricing is separate, clear

#### Step 4.5.3: Payment Processing

- **Secure payment**: Stripe (international) or Flutterwave/Paystack (Nigeria)
- **No redirect**: Payment modal stays in app (reduces friction)
- **Clear feedback**: "Processing payment..." → "Payment successful"
- **Error handling**: Clear error messages if payment fails

**Why in-app payment:**

- Reduces friction (no redirect)
- Maintains context (user doesn't leave app)
- Better UX (feels seamless)

#### Step 4.5.4: Subscription Active

- **Success state**: "Welcome! Your subscription is active"
- **Next billing date**: Shown clearly (e.g., "Next billing: March 15")
- **Access maintained**: Full access continues
- **Billing info**: Accessible in settings (easy to update)

**Why show next billing date:**

- Transparency builds trust
- Users can plan (no surprises)
- Reduces support questions

---

### Stage 5: Mastery & Advanced Usage

**User State**: Confident, power user, exploring advanced features

#### Step 5.1: Custom Content Creation

- **Users can**: Edit AI-generated flashcards, add custom questions
- **UI**: Inline editing, save changes
- **Versioning**: Users see their edits, AI suggestions as alternatives

**Why allow editing:**

- Users know their learning style best
- Ownership increases engagement
- AI is a guide, not a dictator

#### Step 5.2: Multiple Documents

- **Document library**: Clean list/grid view
- **Organization**: Tags or folders (optional, not required)
- **Search**: Full-text search across documents

**Why optional organization:**

- Some users love organization, others don't
- Don't force structure that creates friction
- Search is more powerful than folders for many users

#### Step 5.3: Subscription Management

- **Billing settings**: Accessible from profile/settings
- **View billing history**: All past payments, downloadable
- **Update payment method**: Change card, update billing info
- **Cancel subscription**: One click, access until period ends (graceful)
- **Resume subscription**: Easy reactivation if cancelled

**Why easy cancellation:**

- Builds trust (no dark patterns)
- Users can return if they want
- Reduces support burden

**Why graceful cancellation:**

- Access until period ends (fair, not punitive)
- No immediate cutoff (reduces anxiety)
- Users can change mind before period ends

#### Step 5.4: Community Features (Phase 2)

- **Opt-in**: Clear choice to join communities
- **Discovery**: Browse communities, not forced into feed
- **Sharing**: Explicit sharing, not automatic
- **No social pressure**: No likes, no comments, no timelines

**Why opt-in:**

- Respects privacy-first principle
- Users who want community can find it
- Users who don't aren't bothered

---

## Emotional Journey Map

### Emotions to Support

- **Curiosity**: Discovery phase should feel exciting but calm
- **Confidence**: Progress indicators should feel encouraging
- **Focus**: Study sessions should feel immersive
- **Satisfaction**: Mastery should feel rewarding, not stressful

### Emotions to Avoid

- **Anxiety**: No pressure, no deadlines, no failure states
- **Overwhelm**: Progressive disclosure, one action at a time
- **Addiction**: No infinite scroll, no streaks, no notifications
- **Guilt**: No "overdue" language, no judgment

---

## Key UX Principles Applied

1. **One Primary Action Per Screen**: Reduces decision paralysis
2. **Progressive Disclosure**: Show what's needed, when it's needed
3. **Positive Framing**: "Upcoming" not "overdue", "In progress" not "Failed"
4. **No Pressure**: No timers, no streaks, no deadlines
5. **Clear Feedback**: Users always know what's happening
6. **Respect Autonomy**: Skip options, edit capabilities, opt-in features

---

## Journey Friction Points & Solutions

### Friction: "I don't know where to start"

**Solution**: Clear primary action, onboarding guidance, "Start Exploring" option

### Friction: "This feels overwhelming"

**Solution**: Collapsible sections, one document at a time, progressive disclosure

### Friction: "I'm falling behind"

**Solution**: No "overdue" language, positive framing, flexible scheduling

### Friction: "I don't understand this concept"

**Solution**: ELI5 → Advanced explanations, peer explanations (Phase 2), editable content

### Friction: "I want to study my way"

**Solution**: Editable flashcards, custom questions, personal notes, flexible study modes

---

## Success Metrics (Non-Gamified)

- **Time in study session**: Longer = more engaged (but not forced)
- **Topics mastered**: Encouraging, not competitive
- **Content created**: Users editing/creating = ownership
- **Return rate**: Users coming back = value found

**Why these metrics:**

- Focus on learning outcomes, not engagement metrics
- Avoid metrics that encourage addictive behavior
- Measure what matters: understanding, not time spent
