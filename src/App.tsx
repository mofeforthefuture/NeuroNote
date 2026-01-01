import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/landing'
import { SignInPage } from '@/pages/signin'
import { SignUpPage } from '@/pages/signup'
import { HomePage } from '@/pages/home'
import { DocumentUploadPage } from '@/pages/document-upload'
import { DocumentProcessingPage } from '@/pages/document-processing'
import { DocumentDetailPage } from '@/pages/document-detail'
import { TopicDetailPage } from '@/pages/topic-detail'
import { FlashcardSessionPage } from '@/pages/flashcard-session'
import { PracticeQuestionsPage } from '@/pages/practice-questions'
import { ProgressPage } from '@/pages/progress'
import { SettingsPage } from '@/pages/settings'
import { AppShell } from '@/components/layout/app-shell'

/**
 * Main App component
 * Sets up routing and layout structure
 */
function App() {
  // TODO: Add authentication check
  const isAuthenticated = false

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <AppShell>
                <HomePage />
              </AppShell>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Document Routes */}
        <Route
          path="/documents/upload"
          element={
            isAuthenticated ? (
              <AppShell>
                <DocumentUploadPage />
              </AppShell>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/documents/processing"
          element={
            isAuthenticated ? (
              <AppShell>
                <DocumentProcessingPage />
              </AppShell>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/documents/:id"
          element={
            isAuthenticated ? (
              <AppShell>
                <DocumentDetailPage />
              </AppShell>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Topic Routes */}
        <Route
          path="/topics/:id"
          element={
            isAuthenticated ? (
              <AppShell>
                <TopicDetailPage />
              </AppShell>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/topics/:topicId/flashcards"
          element={
            isAuthenticated ? (
              <AppShell>
                <FlashcardSessionPage />
              </AppShell>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/topics/:topicId/questions"
          element={
            isAuthenticated ? (
              <AppShell>
                <PracticeQuestionsPage />
              </AppShell>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Progress Route */}
        <Route
          path="/progress"
          element={
            isAuthenticated ? (
              <AppShell>
                <ProgressPage />
              </AppShell>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Settings Route */}
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <AppShell>
                <SettingsPage />
              </AppShell>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

