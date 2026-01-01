# NeuroNote

Transform academic PDFs into a personal learning system with flashcards, practice questions, and spaced repetition.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn UI components (Button, Card, etc.)
│   └── layout/         # Layout components (Header, Sidebar, AppShell)
├── pages/              # Page components (Landing, Home, etc.)
├── lib/                # Utility functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── styles/             # Global styles and CSS
```

## 🎨 Design System

This project follows a dark-mode-first design system with:

- **Colors**: Calm, low-eye-strain palette optimized for long study sessions
- **Typography**: Inter font with generous line heights
- **Spacing**: 4px base unit system for consistency
- **Motion**: Functional animations (max 300ms, ease-out curves)

See `docs/design-system.md` for complete design tokens.

## 🛠️ Tech Stack

- **React 18** + **TypeScript** - Type-safe UI
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Accessible component library (Radix UI)
- **React Router** - Client-side routing
- **Framer Motion** - Functional animations

## 📚 Documentation

- [Database Schema](./docs/database-schema.md)
- [User Journey](./docs/user-journey.md)
- [Design System](./docs/design-system.md)
- [Pricing Model](./docs/pricing-model.md)
- [Document Processing Flow](./docs/document-processing-flow.md)

## 🏗️ Architecture Principles

1. **Modularity**: Components are self-contained and reusable
2. **Type Safety**: Full TypeScript coverage
3. **Accessibility**: WCAG AA compliant (Radix UI)
4. **Performance**: Code splitting, lazy loading
5. **Clean Code**: ESLint, consistent formatting

## 🎯 Next Steps

- [ ] Set up Supabase integration
- [ ] Implement authentication
- [ ] Build PDF upload and processing
- [ ] Create flashcard study interface
- [ ] Add progress tracking

## 📝 License

Private project - All rights reserved

