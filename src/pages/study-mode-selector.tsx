import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileQuestion, Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDocumentTopics } from '@/lib/documents'
import { supabase } from '@/lib/supabase'
import type { Topic } from '@/types'

/**
 * Study Mode Selector page
 * Allows users to choose what to study (flashcards, questions, or both)
 */
export function StudyModeSelectorPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [studyMode, setStudyMode] = useState<'flashcards' | 'questions' | 'both'>('both')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFlashcards: 0,
    totalQuestions: 0,
  })

  useEffect(() => {
    if (documentId) {
      loadData()
    }
  }, [documentId])

  const loadData = async () => {
    if (!documentId) return

    setIsLoading(true)

    // Load topics
    const { topics: docTopics } = await getDocumentTopics(documentId)
    if (docTopics && docTopics.length > 0) {
      // Map database rows to Topic type
      const mappedTopics: Topic[] = docTopics.map((t: any) => ({
        id: t.id,
        documentId: t.document_id,
        title: t.title,
        description: t.description || undefined,
        pageReferences: t.page_references || [],
        createdAt: t.created_at,
      }))
      setTopics(mappedTopics)
      // Select all topics by default
      setSelectedTopics(new Set(mappedTopics.map((t) => t.id)))
    }

    // Load stats
    const topicIds = (docTopics || []).map((t: any) => t.id)
    if (topicIds.length > 0) {
      const [flashcardsResult, questionsResult] = await Promise.all([
        supabase
          .from('flashcards')
          .select('id', { count: 'exact', head: true })
          .in('topic_id', topicIds),
        supabase
          .from('exam_questions')
          .select('id', { count: 'exact', head: true })
          .in('topic_id', topicIds),
      ])

      setStats({
        totalFlashcards: flashcardsResult.count || 0,
        totalQuestions: questionsResult.count || 0,
      })
    }

    setIsLoading(false)
  }

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(topicId)) {
        newSet.delete(topicId)
      } else {
        newSet.add(topicId)
      }
      return newSet
    })
  }

  const handleStartStudying = () => {
    if (selectedTopics.size === 0) return

    const topicIds = Array.from(selectedTopics)

    if (studyMode === 'flashcards') {
      // Start with first topic's flashcards
      navigate(`/study/flashcards/${topicIds[0]}`)
    } else if (studyMode === 'questions') {
      // Start with first topic's questions
      navigate(`/study/questions/${topicIds[0]}`)
    } else {
      // Start with flashcards first
      navigate(`/study/flashcards/${topicIds[0]}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-foreground-secondary">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/documents/${documentId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Document
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold">Start Studying</h1>
          <p className="text-foreground-secondary">
            Choose topics and study mode to begin your session
          </p>
        </div>
      </div>

      {/* Study Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Study Mode</CardTitle>
          <CardDescription>Choose how you want to study</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button
              onClick={() => setStudyMode('flashcards')}
              className={`rounded-lg border p-4 text-left transition-all ${
                studyMode === 'flashcards'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <BookOpen className="mb-2 h-6 w-6 text-primary" />
              <h3 className="font-semibold">Flashcards</h3>
              <p className="mt-1 text-sm text-foreground-secondary">
                Review key concepts with spaced repetition
              </p>
              <Badge variant="secondary" className="mt-2">
                {stats.totalFlashcards} cards
              </Badge>
            </button>

            <button
              onClick={() => setStudyMode('questions')}
              className={`rounded-lg border p-4 text-left transition-all ${
                studyMode === 'questions'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <FileQuestion className="mb-2 h-6 w-6 text-primary" />
              <h3 className="font-semibold">Practice Questions</h3>
              <p className="mt-1 text-sm text-foreground-secondary">
                Test your understanding with questions
              </p>
              <Badge variant="secondary" className="mt-2">
                {stats.totalQuestions} questions
              </Badge>
            </button>

            <button
              onClick={() => setStudyMode('both')}
              className={`rounded-lg border p-4 text-left transition-all ${
                studyMode === 'both'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Sparkles className="mb-2 h-6 w-6 text-primary" />
              <h3 className="font-semibold">Both</h3>
              <p className="mt-1 text-sm text-foreground-secondary">
                Start with flashcards, then practice questions
              </p>
              <Badge variant="secondary" className="mt-2">
                Complete study
              </Badge>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Topic Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Topics</CardTitle>
          <CardDescription>
            Choose which topics to include in your study session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  selectedTopics.has(topic.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{topic.title}</h3>
                    <p className="mt-1 text-sm text-foreground-secondary">
                      {topic.description || 'No description'}
                    </p>
                  </div>
                  <Badge variant={selectedTopics.has(topic.id) ? 'default' : 'secondary'}>
                    {selectedTopics.has(topic.id) ? 'Selected' : 'Not selected'}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Start Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleStartStudying}
          disabled={selectedTopics.size === 0}
          className="min-w-[200px]"
        >
          <Play className="mr-2 h-5 w-5" />
          Start Studying
        </Button>
      </div>
    </div>
  )
}

