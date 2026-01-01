/**
 * Core type definitions for NeuroNote
 * Centralized type definitions for better type safety and maintainability
 */

// User types
export interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  countryCode?: string
  isMedicalField: boolean
  createdAt: string
}

export interface UserProfile {
  id: string
  displayName?: string
  avatarUrl?: string
  timezone: string
  countryCode?: string
  isMedicalField: boolean
  studyPreferences: StudyPreferences
  createdAt: string
  updatedAt: string
}

export interface StudyPreferences {
  theme?: 'dark' | 'light'
  fontSize?: 'small' | 'medium' | 'large'
  [key: string]: unknown
}

// Document types
export interface Document {
  id: string
  userId: string
  title: string
  filePath: string
  fileSize: number
  pageCount?: number
  contentHash: string
  sharedContentId?: string
  uploadedAt: string
  processedAt?: string
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  metadata: Record<string, unknown>
}

// Topic types
export interface Topic {
  id: string
  documentId: string
  title: string
  description?: string
  pageReferences: number[]
  createdAt: string
}

// Flashcard types
export interface Flashcard {
  id: string
  topicId: string
  frontText: string
  backText: string
  difficultyLevel: 'easy' | 'medium' | 'hard'
  aiGenerated: boolean
  version: number
  createdAt: string
  updatedAt: string
}

// Progress types
export interface UserProgress {
  id: string
  userId: string
  contentType: 'flashcard' | 'exam_question' | 'vocabulary_term'
  contentId: string
  masteryLevel: number
  lastReviewedAt?: string
  nextReviewAt?: string
  reviewCount: number
  correctCount: number
  incorrectCount: number
  easeFactor: number
  intervalDays: number
  createdAt: string
  updatedAt: string
}

// Subscription types
export interface Subscription {
  id: string
  userId: string
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
  subscriptionTier: 'base' | 'medical'
  countryCode: string
  currency: 'NGN' | 'USD'
  amount: number
  trialEndsAt?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Form types
export interface SignUpForm {
  email: string
  password: string
  confirmPassword: string
  isMedicalField: boolean
}

export interface SignInForm {
  email: string
  password: string
}

// Navigation types
export interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string
}

