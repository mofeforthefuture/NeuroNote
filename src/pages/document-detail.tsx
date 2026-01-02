import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileQuestion, Play, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getDocument, getDocumentTopics, deleteDocument } from '@/lib/documents'
import { generateTopicsForDocument } from '@/lib/topics'
import { getTopicProgress } from '@/lib/study-session'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import type { Topic, Document } from '@/types'

/**
 * Document Detail page
 * Shows topics and navigation to study materials
 */
export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [document, setDocument] = useState<Document | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicStats, setTopicStats] = useState<
    Map<
      string,
      {
        flashcardCount: number
        questionCount: number
        progress: number
        status: 'not_started' | 'in_progress' | 'mastered'
      }
    >
  >(new Map())
  const [stats, setStats] = useState({
    flashcardCount: 0,
    questionCount: 0,
    progress: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadDocumentData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Auto-refresh if processing is in progress
  useEffect(() => {
    if (document?.processingStatus === 'processing') {
      const interval = setInterval(() => {
        loadDocumentData()
      }, 5000) // Check every 5 seconds

      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.processingStatus])

  const loadDocumentData = async () => {
    if (!id) return

    setIsLoading(true)

    // Load document
    const { document: doc, error: docError } = await getDocument(id)
    if (docError || !doc) {
      console.error('Failed to load document:', docError)
      setIsLoading(false)
      return
    }

    setDocument(doc)

    // Load topics
    const { topics: docTopics, error: topicsError } = await getDocumentTopics(id)
    if (topicsError) {
      console.error('Failed to load topics:', topicsError)
    } else {
      setTopics(docTopics as Topic[])
    }

    // Load stats for each topic and overall
    let totalFlashcardCount = 0
    let totalQuestionCount = 0
    let totalMastered = 0
    let totalItems = 0
    const newTopicStats = new Map<
      string,
      {
        flashcardCount: number
        questionCount: number
        progress: number
        status: 'not_started' | 'in_progress' | 'mastered'
      }
    >()

    if (docTopics && docTopics.length > 0) {
      // Get counts and progress for each topic
      const topicStatsPromises = docTopics.map(async (topic: Topic) => {
        const topicId = topic.id
        // Get flashcard and question counts for this topic
        const [flashcardsResult, questionsResult, progressResult] = await Promise.all([
          supabase
            .from('flashcards')
            .select('id', { count: 'exact', head: true })
            .eq('topic_id', topicId),
          supabase
            .from('exam_questions')
            .select('id', { count: 'exact', head: true })
            .eq('topic_id', topicId),
          getTopicProgress(topicId),
        ])

        // Type assertions for count queries
        const flashcardCount = flashcardsResult.count ?? 0
        const questionCount = questionsResult.count ?? 0
        const progress = progressResult.progress?.percentage || 0
        const totalTopicItems = flashcardCount + questionCount
        const masteredItems = progressResult.progress?.mastered || 0

        // Determine status
        let status: 'not_started' | 'in_progress' | 'mastered' = 'not_started'
        if (progress >= 80) {
          status = 'mastered'
        } else if (progress > 0) {
          status = 'in_progress'
        }

        totalFlashcardCount += flashcardCount
        totalQuestionCount += questionCount
        totalMastered += masteredItems
        totalItems += totalTopicItems

        return {
          topicId: topicId,
          stats: {
            flashcardCount,
            questionCount,
            progress,
            status,
          },
        }
      })

      const topicStatsResults = await Promise.all(topicStatsPromises)
      topicStatsResults.forEach(({ topicId, stats }) => {
        newTopicStats.set(topicId, stats)
      })
    }

    setTopicStats(newTopicStats)
    setStats({
      flashcardCount: totalFlashcardCount,
      questionCount: totalQuestionCount,
      progress: totalItems > 0 ? Math.round((totalMastered / totalItems) * 100) : 0,
    })

    setIsLoading(false)
  }

  const handleGenerateTopics = async () => {
    if (!id) return

    setIsGeneratingTopics(true)
    setGenerationError(null)

    const { error } = await generateTopicsForDocument(id)

    if (error) {
      setGenerationError(error)
      setIsGeneratingTopics(false)
      return
    }

    // Reload topics and stats
    await loadDocumentData()
    setIsGeneratingTopics(false)
  }

  const handleDelete = async () => {
    if (!id) return

    setIsDeleting(true)
    const { error } = await deleteDocument(id)

    if (error) {
      toast({
        title: 'Delete failed',
        description: error,
        variant: 'error',
      })
      setIsDeleting(false)
      return
    }

    toast({
      title: 'Document deleted',
      description: 'The document and all its content have been deleted.',
      variant: 'success',
    })

    // Navigate back to documents list
    navigate('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-foreground-secondary">Loading document...</p>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-foreground-secondary">Document not found</p>
            <Button asChild>
              <Link to="/dashboard">Back to Documents</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold">{document.title}</h1>
          <div className="flex items-center gap-4">
            <p className="text-foreground-secondary">
              {topics.length} topics • {stats.flashcardCount} flashcards • {stats.questionCount}{' '}
              questions
            </p>
            {document.processingStatus && (
              <Badge
                variant={
                  document.processingStatus === 'completed'
                    ? 'default'
                    : document.processingStatus === 'processing'
                    ? 'secondary'
                    : document.processingStatus === 'failed'
                    ? 'warning'
                    : 'secondary'
                }
              >
                {document.processingStatus === 'completed'
                  ? 'Ready'
                  : document.processingStatus === 'processing'
                  ? 'Processing...'
                  : document.processingStatus === 'failed'
                  ? 'Failed'
                  : 'Pending'}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {document.processingStatus === 'completed' && (
            <Button asChild>
              <Link to={`/documents/${id}/study`}>
                <Play className="mr-2 h-4 w-4" />
                Start Studying
              </Link>
            </Button>
          )}
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{document.title}"? This will permanently delete:
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>The document file</li>
                <li>All topics ({topics.length})</li>
                <li>All flashcards ({stats.flashcardCount})</li>
                <li>All practice questions ({stats.questionCount})</li>
                <li>All vocabulary terms</li>
                <li>All study progress</li>
              </ul>
              <p className="mt-3 font-medium text-destructive">This action cannot be undone.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Processing Status Alerts */}
      {document.processingStatus === 'failed' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Processing Failed</CardTitle>
            <CardDescription>
              The document processing encountered an error. You can try processing again or generate
              topics manually.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={handleGenerateTopics} disabled={isGeneratingTopics}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Topics Now
            </Button>
          </CardContent>
        </Card>
      )}

      {document.processingStatus === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle>Processing in Progress</CardTitle>
            <CardDescription>
              Your document is being processed. This may take a few minutes. Topics will appear
              automatically when ready.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>Your mastery across all topics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-secondary">Topics Mastered</span>
              <span className="font-medium">{stats.progress}%</span>
            </div>
            <Progress value={stats.progress} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold">{topics.length}</p>
              <p className="text-sm text-foreground-secondary">Topics</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.flashcardCount}</p>
              <p className="text-sm text-foreground-secondary">Flashcards</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.questionCount}</p>
              <p className="text-sm text-foreground-secondary">Questions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Topics</h2>
          {topics.length === 0 &&
            !isGeneratingTopics &&
            document.processingStatus === 'completed' && (
              <Button onClick={handleGenerateTopics} disabled={isGeneratingTopics}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Topics
              </Button>
            )}
        </div>

        {topics.length === 0 && !isGeneratingTopics && (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-foreground-secondary" />
              <h3 className="mb-2 text-lg font-semibold">No topics generated yet</h3>
              <p className="mb-6 text-foreground-secondary">
                {document.processingStatus === 'completed'
                  ? 'Topics were not generated during processing. Generate them now to start studying.'
                  : document.processingStatus === 'processing'
                  ? 'Topics will appear automatically when processing completes.'
                  : document.processingStatus === 'failed'
                  ? 'Processing failed. Generate topics manually to continue.'
                  : 'Generate topics from your document to start studying'}
              </p>
              {document.processingStatus !== 'processing' && (
                <Button onClick={handleGenerateTopics}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Topics
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {isGeneratingTopics && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <h3 className="mb-2 text-lg font-semibold">Generating topics...</h3>
              <p className="text-foreground-secondary">
                Analyzing your document and extracting key topics. This may take a minute.
              </p>
            </CardContent>
          </Card>
        )}

        {generationError && (
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-sm text-destructive">
                <strong>Error:</strong> {generationError}
              </p>
              <Button variant="secondary" className="mt-4" onClick={handleGenerateTopics}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {topics.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topics.map(topic => {
              const stats = topicStats.get(topic.id) || {
                flashcardCount: 0,
                questionCount: 0,
                progress: 0,
                status: 'not_started' as const,
              }

              const badgeVariant =
                stats.status === 'mastered'
                  ? 'default'
                  : stats.status === 'in_progress'
                  ? 'secondary'
                  : 'outline'

              const badgeText =
                stats.status === 'mastered'
                  ? 'Mastered'
                  : stats.status === 'in_progress'
                  ? 'In Progress'
                  : 'Not Started'

              return (
                <Card
                  key={topic.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTopic === topic.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTopic(topic.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{topic.title}</CardTitle>
                      <Badge variant={badgeVariant}>{badgeText}</Badge>
                    </div>
                    <CardDescription>
                      {topic.pageReferences && topic.pageReferences.length > 0
                        ? `Pages ${topic.pageReferences.join(', ')}`
                        : 'No page references'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">Progress</span>
                        <span className="text-foreground-secondary">{stats.progress}%</span>
                      </div>
                      <Progress value={stats.progress} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                      <BookOpen className="h-4 w-4" />
                      <span>
                        {stats.flashcardCount}{' '}
                        {stats.flashcardCount === 1 ? 'flashcard' : 'flashcards'}
                      </span>
                      <FileQuestion className="ml-4 h-4 w-4" />
                      <span>
                        {stats.questionCount} {stats.questionCount === 1 ? 'question' : 'questions'}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      className="mt-4 w-full"
                      asChild
                      onClick={e => e.stopPropagation()}
                    >
                      <Link to={`/topics/${topic.id}`}>View Topic</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
