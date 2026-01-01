# Design System: Core UI Layout System

## Design Philosophy

**Why a design system:**
- **Consistency**: Reduces cognitive load (users don't relearn UI patterns)
- **Accessibility**: Ensures readable, navigable interfaces
- **Maintainability**: Single source of truth for visual decisions
- **Calm aesthetic**: Every token chosen to reduce eye strain and anxiety

**Core principle**: Every design decision must support focus, clarity, and calm.

---

## Color System

### Design Rationale

**Why dark-mode-first:**
- **Reduced eye strain**: Lower brightness for long study sessions
- **Focus**: Dark backgrounds reduce visual noise
- **Modern aesthetic**: Aligns with user expectations for learning tools
- **Accessibility**: High contrast ratios support readability

**Color psychology:**
- **No red for errors**: Red signals danger/failure (creates anxiety)
- **Green for success**: Calm, positive reinforcement
- **Blue for progress**: Trustworthy, calm, professional
- **Gray for neutral**: Non-judgmental, supportive

### Color Tokens

#### Base Colors (Dark Mode)

```typescript
// Backgrounds (darkest to lightest)
const colors = {
  // Background hierarchy
  bg: {
    primary: '#0a0a0a',      // Main app background (deep black)
    secondary: '#121212',    // Card backgrounds, elevated surfaces
    tertiary: '#1a1a1a',     // Hover states, subtle elevation
    elevated: '#242424',     // Modals, dropdowns, popovers
  },

  // Text hierarchy (lightest to darkest for contrast)
  text: {
    primary: '#f5f5f5',      // Main content text (high contrast)
    secondary: '#d4d4d4',    // Secondary text, labels
    tertiary: '#a3a3a3',     // Placeholder, disabled text
    inverse: '#0a0a0a',      // Text on light backgrounds (rare)
  },

  // Semantic colors (calm, non-alarming)
  semantic: {
    success: '#10b981',      // Green (mastered, correct) - calm green
    info: '#3b82f6',         // Blue (information, progress) - trustworthy
    warning: '#f59e0b',      // Amber (attention needed, not urgent)
    error: '#ef4444',        // Red (errors only, not failures) - use sparingly
  },

  // Interactive states
  interactive: {
    primary: '#3b82f6',      // Primary actions (blue)
    primaryHover: '#2563eb', // Hover state
    primaryActive: '#1d4ed8', // Active/pressed state
    secondary: '#4b5563',    // Secondary actions (gray)
    secondaryHover: '#6b7280',
    secondaryActive: '#374151',
    disabled: '#374151',     // Disabled state (muted)
    disabledText: '#6b7280',
  },

  // Borders and dividers
  border: {
    default: '#2a2a2a',      // Subtle borders
    hover: '#3a3a3a',        // Hover state borders
    focus: '#3b82f6',        // Focus ring (blue)
    divider: '#1a1a1a',      // Section dividers
  },

  // Overlays
  overlay: {
    backdrop: 'rgba(0, 0, 0, 0.75)', // Modal backdrops
    tooltip: 'rgba(0, 0, 0, 0.9)',   // Tooltip backgrounds
  },
}
```

**Why these specific values:**
- **#0a0a0a background**: Deep enough to reduce eye strain, not pure black (pure black can cause eye fatigue on OLED)
- **#f5f5f5 text**: High contrast (WCAG AAA) without being harsh white
- **#3b82f6 blue**: Calm, professional, accessible contrast
- **#10b981 green**: Muted green (not bright lime) for calm success states

#### Light Mode (Optional, Secondary)

```typescript
const lightColors = {
  bg: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    elevated: '#ffffff',
  },
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
  },
  // Semantic and interactive colors remain similar
  // (adjust brightness for light mode contrast)
}
```

**Why light mode is secondary:**
- Primary use case is long study sessions (dark mode preferred)
- Light mode available for accessibility, but not default
- Reduces maintenance burden (one primary theme)

---

## Typography

### Design Rationale

**Why these choices:**
- **Readability**: Fonts optimized for screen reading
- **Hierarchy**: Clear size/weight differences reduce cognitive load
- **Line height**: Generous spacing prevents eye strain
- **Letter spacing**: Slightly increased for clarity

### Type Scale

```typescript
const typography = {
  // Font families
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ],
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Consolas',
      'monospace',
    ],
  },

  // Font sizes (rem-based for accessibility)
  fontSize: {
    xs: '0.75rem',    // 12px - Labels, captions
    sm: '0.875rem',   // 14px - Secondary text
    base: '1rem',     // 16px - Body text (minimum for readability)
    lg: '1.125rem',   // 18px - Emphasized body
    xl: '1.25rem',    // 20px - Small headings
    '2xl': '1.5rem',  // 24px - Section headings
    '3xl': '1.875rem', // 30px - Page headings
    '4xl': '2.25rem',  // 36px - Hero text (rare)
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights (generous for readability)
  lineHeight: {
    tight: 1.25,      // Headings
    normal: 1.5,      // Body text
    relaxed: 1.75,    // Long-form content
    loose: 2.0,       // Poetry, special cases
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.025em', // Headings (slightly tighter)
    normal: '0em',       // Body text
    wider: '0.025em',    // Uppercase, labels
  },
}
```

**Why Inter font:**
- Designed for screens (excellent readability)
- Neutral, professional (doesn't distract from content)
- Good weight range (supports hierarchy)
- Free, widely available

**Why generous line heights:**
- Reduces eye strain during long reading sessions
- Improves comprehension (studies show 1.5-1.75 optimal)
- Feels calm, not cramped

### Typography Scale Usage

```typescript
// Heading hierarchy
const headings = {
  h1: {
    fontSize: '3xl',      // 30px
    fontWeight: 700,
    lineHeight: 'tight',
    letterSpacing: 'tighter',
  },
  h2: {
    fontSize: '2xl',      // 24px
    fontWeight: 600,
    lineHeight: 'tight',
  },
  h3: {
    fontSize: 'xl',       // 20px
    fontWeight: 600,
    lineHeight: 'normal',
  },
}

// Body text
const body = {
  default: {
    fontSize: 'base',     // 16px
    fontWeight: 400,
    lineHeight: 'normal',
  },
  large: {
    fontSize: 'lg',        // 18px
    fontWeight: 400,
    lineHeight: 'relaxed',
  },
}

// Special cases
const special = {
  flashcard: {
    fontSize: 'xl',       // 20px (larger for focus)
    fontWeight: 400,
    lineHeight: 'relaxed',
  },
  code: {
    fontFamily: 'mono',
    fontSize: 'sm',       // 14px
    lineHeight: 'normal',
  },
}
```

---

## Spacing System

### Design Rationale

**Why 4px base unit:**
- **Consistency**: All spacing is multiple of 4 (reduces decision fatigue)
- **Visual rhythm**: Creates harmonious layout
- **Accessibility**: Generous spacing improves readability
- **Scalability**: Easy to maintain and extend

### Spacing Scale

```typescript
const spacing = {
  // Base unit: 4px
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
}
```

### Spacing Usage Patterns

```typescript
// Component spacing
const componentSpacing = {
  // Cards
  cardPadding: spacing[6],        // 24px (generous, calm)
  cardGap: spacing[4],            // 16px between cards

  // Sections
  sectionPadding: spacing[8],     // 32px vertical padding
  sectionGap: spacing[12],        // 48px between sections

  // Forms
  inputPadding: spacing[4],       // 16px (comfortable)
  inputGap: spacing[4],           // 16px between inputs
  labelGap: spacing[2],           // 8px between label and input

  // Buttons
  buttonPaddingX: spacing[6],     // 24px horizontal
  buttonPaddingY: spacing[3],     // 12px vertical
  buttonGap: spacing[4],          // 16px between buttons

  // Navigation
  navItemPadding: spacing[4],     // 16px
  navItemGap: spacing[2],         // 8px

  // Content
  contentMaxWidth: '65ch',        // Optimal reading width
  contentPadding: spacing[8],     // 32px
  paragraphGap: spacing[6],      // 24px between paragraphs
}
```

**Why generous spacing:**
- Reduces visual clutter (core principle)
- Improves readability
- Feels calm, not cramped
- Supports focus (less visual noise)

---

## Border Radius

### Design Rationale

**Why subtle radius:**
- **Modern**: Soft edges feel contemporary
- **Calm**: Sharp corners can feel aggressive
- **Consistent**: Same radius across components creates harmony

```typescript
const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px - Small elements (badges, tags)
  base: '0.5rem',   // 8px - Buttons, inputs, cards
  md: '0.75rem',    // 12px - Larger cards, modals
  lg: '1rem',       // 16px - Special cases (rare)
  full: '9999px',   // Pills, avatars
}
```

---

## Shadows & Elevation

### Design Rationale

**Why subtle shadows:**
- **Depth**: Creates hierarchy without noise
- **Focus**: Elevates important elements
- **Calm**: Subtle, not dramatic

```typescript
const shadows = {
  // Elevation levels (subtle, dark-mode optimized)
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  base: '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.7)',
  
  // Focus rings (accessible, visible)
  focus: '0 0 0 3px rgba(59, 130, 246, 0.5)', // Blue focus ring
  focusError: '0 0 0 3px rgba(239, 68, 68, 0.5)', // Red focus ring (errors)
}
```

**Why dark-mode optimized shadows:**
- Shadows on dark backgrounds need higher opacity
- Creates depth without being harsh
- Focus rings use color (blue) for visibility

---

## Motion & Animation

### Design Rationale

**Why functional motion:**
- **Guidance**: Motion directs attention
- **Feedback**: Confirms user actions
- **Calm**: Slow, smooth, never jarring
- **Accessibility**: Respects `prefers-reduced-motion`

### Animation Tokens

```typescript
const motion = {
  // Durations (fast, functional)
  duration: {
    fast: '150ms',      // Micro-interactions (hover, focus)
    base: '200ms',      // Standard transitions
    slow: '300ms',      // Complex animations (max allowed)
  },

  // Easing curves (ease-out preferred)
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)', // Ease-out
    in: 'cubic-bezier(0.4, 0, 1, 1)',        // Ease-in
    out: 'cubic-bezier(0, 0, 0.2, 1)',       // Ease-out
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',   // Ease-in-out
  },

  // Common animations
  transitions: {
    default: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
}
```

**Why ease-out curves:**
- Feels natural (objects slow down, not speed up)
- Reduces perceived latency
- Calm, not aggressive

**Why max 300ms:**
- Faster feels responsive
- Slower feels sluggish
- 300ms is threshold for "instant" feeling

### Animation Usage

```typescript
// Common patterns
const animations = {
  // Card hover
  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: shadows.md,
    transition: motion.transitions.default,
  },

  // Button press
  buttonPress: {
    transform: 'scale(0.98)',
    transition: motion.transitions.transform,
  },

  // Modal enter/exit
  modalEnter: {
    opacity: 0,
    transform: 'scale(0.95)',
    transition: motion.transitions.default,
  },
  modalEnterActive: {
    opacity: 1,
    transform: 'scale(1)',
  },

  // Flashcard flip
  flashcardFlip: {
    transform: 'rotateY(180deg)',
    transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
}
```

**Why functional motion only:**
- Decorative motion distracts from content
- Every animation should have purpose
- Reduces cognitive load

---

## Layout Patterns

### Design Rationale

**Why these patterns:**
- **Consistency**: Users learn patterns once
- **Clarity**: Clear hierarchy reduces confusion
- **Focus**: One primary action per screen

### Container Widths

```typescript
const containers = {
  // Content width (optimal reading)
  content: '65ch',           // Max width for text content

  // Component widths
  card: '100%',              // Flexible, responsive
  cardMax: '32rem',          // 512px max card width

  // Layout widths
  sidebar: '16rem',          // 256px sidebar
  main: 'calc(100% - 16rem)', // Main content area

  // Breakpoints (mobile-first)
  breakpoints: {
    sm: '640px',             // Small tablets
    md: '768px',             // Tablets
    lg: '1024px',            // Laptops
    xl: '1280px',            // Desktops
    '2xl': '1536px',         // Large desktops
  },
}
```

**Why 65ch content width:**
- Optimal reading line length (studies show 45-75 characters)
- Reduces eye strain
- Improves comprehension

### Grid System

```typescript
// Card grid (responsive)
const grid = {
  // Document grid
  documents: {
    base: '1fr',                    // Single column on mobile
    md: 'repeat(2, 1fr)',           // 2 columns on tablet
    lg: 'repeat(3, 1fr)',            // 3 columns on desktop
    gap: spacing[6],                // 24px gap
  },

  // Topic grid
  topics: {
    base: '1fr',
    md: 'repeat(2, 1fr)',
    lg: 'repeat(3, 1fr)',
    gap: spacing[4],                // 16px gap
  },
}
```

**Why responsive grid:**
- Adapts to screen size
- Prevents cramped layouts on mobile
- Utilizes space on desktop

---

## Component Patterns

### Cards

```typescript
const card = {
  padding: spacing[6],              // 24px
  borderRadius: borderRadius.base,   // 8px
  backgroundColor: colors.bg.secondary,
  border: `1px solid ${colors.border.default}`,
  boxShadow: shadows.sm,
  transition: motion.transitions.default,
  
  hover: {
    borderColor: colors.border.hover,
    boxShadow: shadows.md,
    transform: 'translateY(-2px)',
  },
}
```

**Why card-based:**
- Visual separation (reduces cognitive load)
- Clear affordances (card = clickable)
- Consistent pattern across app

### Buttons

```typescript
const button = {
  // Primary button
  primary: {
    paddingX: spacing[6],           // 24px
    paddingY: spacing[3],           // 12px
    backgroundColor: colors.interactive.primary,
    color: colors.text.inverse,
    borderRadius: borderRadius.base,
    fontWeight: typography.fontWeight.medium,
    transition: motion.transitions.colors,
    
    hover: {
      backgroundColor: colors.interactive.primaryHover,
    },
    
    active: {
      backgroundColor: colors.interactive.primaryActive,
      transform: 'scale(0.98)',
    },
  },

  // Secondary button
  secondary: {
    paddingX: spacing[6],
    paddingY: spacing[3],
    backgroundColor: 'transparent',
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: borderRadius.base,
    
    hover: {
      borderColor: colors.border.hover,
      backgroundColor: colors.bg.tertiary,
    },
  },
}
```

**Why clear button hierarchy:**
- Primary action is obvious
- Reduces decision fatigue
- Consistent across app

---

## Accessibility

### Design Rationale

**Why accessibility is non-negotiable:**
- **Inclusive**: Everyone should be able to use the product
- **Legal**: WCAG compliance is required
- **Quality**: Accessible design is better design

### Accessibility Standards

```typescript
const accessibility = {
  // Contrast ratios (WCAG AA minimum, AAA preferred)
  contrast: {
    normal: 4.5,        // AA for normal text
    large: 3.0,         // AA for large text (18px+)
    enhanced: 7.0,      // AAA for normal text (preferred)
  },

  // Focus indicators
  focus: {
    outline: 'none',    // Remove default outline
    ring: shadows.focus, // Custom focus ring (visible, accessible)
    ringWidth: '3px',
  },

  // Touch targets (mobile)
  touchTarget: {
    min: '44px',        // Minimum touch target size
    preferred: '48px',  // Preferred size
  },

  // Reduced motion
  reducedMotion: {
    duration: '0ms',    // Disable animations if user prefers
    transform: 'none',  // No transforms
  },
}
```

---

## Implementation Notes

### Tailwind CSS Configuration

These tokens should be mapped to Tailwind config:

```javascript
// tailwind.config.js structure
module.exports = {
  theme: {
    extend: {
      colors: { /* map color tokens */ },
      spacing: { /* map spacing scale */ },
      fontSize: { /* map typography scale */ },
      // ... etc
    },
  },
}
```

### CSS Variables (Alternative)

For dynamic theming, use CSS variables:

```css
:root {
  --color-bg-primary: #0a0a0a;
  --color-text-primary: #f5f5f5;
  /* ... etc */
}
```

---

## Design System Principles Summary

1. **Dark-mode-first**: Every token optimized for dark backgrounds
2. **Generous spacing**: Reduces clutter, improves readability
3. **Calm colors**: No red for failures, positive framing
4. **Functional motion**: Every animation has purpose
5. **Accessibility**: WCAG AA minimum, AAA preferred
6. **Consistency**: Same patterns, same tokens, same experience

**Every design decision must answer:**
- Does this reduce cognitive load?
- Does this support focus and calm?
- Does this improve comprehension?
- Would this work for a 2-hour study session?

If the answer is "no" to any question, redesign it.

