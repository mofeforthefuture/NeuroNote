# NeuroNote: Design Foundation

## Overview

This directory contains the foundational design documents for NeuroNote, a learning platform that transforms academic PDFs into a personal learning system.

**Design is not secondary.** Every decision is justified by psychology, learning science, and clarity.

---

## Documents

### 1. [Database Schema](./database-schema.md)
**Purpose**: Complete database design with Row Level Security (RLS) policies

**Key Decisions:**
- Separation of content, progress, and community data
- Versioning for AI-generated content
- Privacy-first RLS policies
- Extensible schema for Phase 2 community features

**Why it matters:**
- Data architecture determines what's possible
- RLS ensures privacy by default
- Versioning allows content improvement without breaking progress

---

### 2. [User Journey Map](./user-journey.md)
**Purpose**: Complete user flow from first visit → studying → mastery

**Key Decisions:**
- One primary action per screen
- Progressive disclosure (reduce cognitive load)
- No pressure (no timers, no streaks, no "overdue" language)
- Positive framing throughout

**Why it matters:**
- Clear journey reduces anxiety
- Each stage supports learning, not engagement metrics
- Emotional journey map prevents stress-inducing patterns

---

### 3. [Design System](./design-system.md)
**Purpose**: Core UI tokens (colors, typography, spacing, motion)

**Key Decisions:**
- Dark-mode-first (reduces eye strain)
- Generous spacing (reduces clutter)
- Calm color palette (no red for failures)
- Functional motion only (max 300ms)

**Why it matters:**
- Consistency reduces cognitive load
- Calm aesthetic supports long study sessions
- Accessibility ensures inclusive design

---

### 4. [Pricing Model](./pricing-model.md)
**Purpose**: Subscription pricing structure and payment flow

**Key Decisions:**
- Location-based pricing (5k NGN for Nigeria, $5 USD elsewhere)
- Medical field multiplier (2x base price)
- 7-day free trial (no credit card required)
- Transparent, simple pricing

**Why it matters:**
- Fair pricing acknowledges economic differences
- Self-declaration for medical field (trust-based)
- Trial period reduces signup friction

---

### 5. [Document Processing Flow](./document-processing-flow.md)
**Purpose**: PDF deduplication and content extraction pipeline

**Key Decisions:**
- SHA-256 content hashing for deduplication
- Shared content cloning (saves AI costs)
- Privacy-first (users own their data, shared content anonymous)
- Fast cloning for popular documents

**Why it matters:**
- Cost efficiency (don't re-process identical PDFs)
- Speed (popular documents processed instantly)
- Scalability (one processing, many users benefit)
- Privacy maintained (RLS enforced, users own their copies)

---

## Design Principles (Non-Negotiable)

1. **Reduce cognitive load at every step**
2. **One primary action per screen**
3. **No infinite feeds**
4. **No visual clutter**
5. **Calm, intelligent, modern aesthetic**
6. **Design for long study sessions**
7. **Dark-mode-first, low eye strain**
8. **Motion is functional, never decorative**
9. **Progress must feel encouraging, not stressful**

---

## Next Steps

Before writing implementation code:

1. ✅ **Database schema designed** - Ready for Supabase migration (includes subscriptions + deduplication)
2. ✅ **User journey mapped** - Ready for UI wireframes (includes pricing flow)
3. ✅ **Design system defined** - Ready for Tailwind config
4. ✅ **Pricing model defined** - Ready for payment integration
5. ✅ **Document processing flow defined** - Ready for PDF processing pipeline

**Now ready for:**
- Tailwind CSS configuration
- Component library setup (Radix UI)
- Initial UI wireframes/mockups
- Supabase schema migration scripts

---

## Questions to Ask Before Implementation

For every feature or UI decision:

1. **Does this reduce cognitive load?**
2. **Does this support focus and calm?**
3. **Does this improve comprehension?**
4. **Would this work for a 2-hour study session?**

If the answer is "no" to any question, **redesign it**.

---

## Architecture Decisions

### Why Supabase?
- PostgreSQL (robust, extensible)
- Built-in RLS (privacy by default)
- Storage for PDFs (private by default)
- Auth (one less thing to build)

### Why React + TypeScript?
- Type safety prevents bugs
- Component reusability
- Large ecosystem (Radix UI, etc.)

### Why Tailwind CSS?
- Utility-first (faster development)
- Design system integration (tokens map directly)
- Small bundle size

### Why Radix UI?
- Accessible by default
- Unstyled (full design control)
- Headless (no opinionated styles)

### Why PDF.js?
- Industry standard
- Client-side rendering (privacy)
- Extensible for text extraction

---

## Learning Science Principles Applied

1. **Spaced Repetition**: SM-2 algorithm in `user_progress` table
2. **Progressive Disclosure**: ELI5 → Advanced explanations
3. **Active Recall**: Flashcards and practice questions
4. **Contextual Learning**: Vocabulary with document context
5. **Ownership**: User-editable content, personal notes
6. **No Pressure**: No timers, no streaks, no judgment

---

## Community Features (Phase 2)

Designed but not implemented:
- Study communities (opt-in)
- Shared study packs (cloneable)
- Peer explanations (with clarity ratings)
- No timelines, no feeds, no social pressure

**Why opt-in:**
- Privacy-first principle
- Users who want community can find it
- Users who don't aren't bothered

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

---

## Challenge Bad Ideas

If a feature request would:
- Increase anxiety → Challenge it
- Create pressure → Challenge it
- Add visual clutter → Challenge it
- Distract from learning → Challenge it

**Design is not about saying yes. Design is about saying no to the wrong things.**

---

## Contact & Questions

When in doubt, refer back to:
1. Design principles (this document)
2. User journey map (what stage is the user in?)
3. Design system (what tokens should I use?)
4. Database schema (what data do I need?)
5. Document processing flow (how to handle PDF uploads)
6. Pricing model (how subscriptions work)

**Every decision should be traceable to these documents.**

