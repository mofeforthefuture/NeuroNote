import { ArrowRight, BookOpen, FileText, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Landing page component
 * First impression - calm, minimal, focused on value proposition
 */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
            Transform PDFs into a
            <span className="text-primary"> Learning System</span>
          </h1>
          <p className="mb-8 text-lg text-foreground-secondary lg:text-xl">
            Upload academic PDFs and get flashcards, practice questions, and personalized study materials.
            Your documents stay private.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
              <Link to="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-background-secondary py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-semibold">
            Everything you need to study smarter
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <FileText className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Smart Extraction</CardTitle>
                <CardDescription>
                  AI identifies key topics, concepts, and vocabulary from your PDFs automatically.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Interactive Learning</CardTitle>
                <CardDescription>
                  Study with flashcards, practice questions, and spaced repetition for long-term retention.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <GraduationCap className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  Monitor your mastery level and get personalized review schedules.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background-secondary py-8">
        <div className="container mx-auto max-w-6xl px-4 text-center text-sm text-foreground-tertiary">
          <p>© 2024 NeuroNote. Your documents stay private.</p>
        </div>
      </footer>
    </div>
  )
}

