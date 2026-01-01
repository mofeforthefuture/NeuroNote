import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileQuestion, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Topic } from '@/types'

/**
 * Document Detail page
 * Shows topics and navigation to study materials
 */
export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  // TODO: Fetch document and topics from API
  const document = {
    id: id || '1',
    title: 'Introduction to Neuroscience',
    topicCount: 12,
    flashcardCount: 48,
    questionCount: 24,
    progress: 35,
  }

  const topics: Topic[] = [
    { id: '1', documentId: id || '1', title: 'Neurons and Synapses', pageReferences: [1, 2, 3], createdAt: new Date().toISOString() },
    { id: '2', documentId: id || '1', title: 'Neurotransmitters', pageReferences: [4, 5], createdAt: new Date().toISOString() },
    { id: '3', documentId: id || '1', title: 'Brain Anatomy', pageReferences: [6, 7, 8], createdAt: new Date().toISOString() },
  ]

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
          <p className="text-foreground-secondary">
            {document.topicCount} topics • {document.flashcardCount} flashcards •{' '}
            {document.questionCount} questions
          </p>
        </div>
        <Button asChild>
          <Link to={`/documents/${id}/study`}>
            <Play className="mr-2 h-4 w-4" />
            Start Studying
          </Link>
        </Button>
      </div>

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
              <span className="font-medium">{document.progress}%</span>
            </div>
            <Progress value={document.progress} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold">{document.topicCount}</p>
              <p className="text-sm text-foreground-secondary">Topics</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{document.flashcardCount}</p>
              <p className="text-sm text-foreground-secondary">Flashcards</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{document.questionCount}</p>
              <p className="text-sm text-foreground-secondary">Questions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics Grid */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Topics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
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
                  <Badge variant="secondary">In Progress</Badge>
                </div>
                <CardDescription>
                  Pages {topic.pageReferences.join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-secondary">Progress</span>
                    <span className="text-foreground-secondary">45%</span>
                  </div>
                  <Progress value={45} />
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <BookOpen className="h-4 w-4" />
                  <span>12 flashcards</span>
                  <FileQuestion className="ml-4 h-4 w-4" />
                  <span>6 questions</span>
                </div>
                <Button
                  variant="secondary"
                  className="mt-4 w-full"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link to={`/topics/${topic.id}`}>View Topic</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

