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
import { StudyModeSelectorPage } from '@/pages/study-mode-selector'
import { ProgressPage } from '@/pages/progress'
import { SettingsPage } from '@/pages/settings'
import { AppShell } from '@/components/layout/app-shell'
import { useAuth } from '@/hooks/use-auth'

/**
 * Protected Route Component
 * Wraps routes that require authentication
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-foreground-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

/**
 * Main App component
 * Sets up routing and layout structure
 */
function App() {

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
            <ProtectedRoute>
              <AppShell>
                <HomePage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Document Routes */}
        <Route
          path="/documents/upload"
          element={
            <ProtectedRoute>
              <AppShell>
                <DocumentUploadPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/processing"
          element={
            <ProtectedRoute>
              <AppShell>
                <DocumentProcessingPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <DocumentDetailPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:documentId/study"
          element={
            <ProtectedRoute>
              <AppShell>
                <StudyModeSelectorPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Topic Routes */}
        <Route
          path="/topics/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <TopicDetailPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/study/flashcards/:topicId"
          element={
            <ProtectedRoute>
              <AppShell>
                <FlashcardSessionPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/study/questions/:topicId"
          element={
            <ProtectedRoute>
              <AppShell>
                <PracticeQuestionsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Progress Route */}
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <AppShell>
                <ProgressPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Settings Route */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppShell>
                <SettingsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

