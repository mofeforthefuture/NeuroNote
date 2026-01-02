import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Textarea } from '@/components/ui/textarea'
import {
  getTopic,
  getTopicFlashcards,
  getTopicQuestions,
  getTopicExplanations,
  getDocumentVocabulary,
  generateMoreQuestionsForTopic,
} from '@/lib/topics'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Sparkles } from 'lucide-react'
import type { Flashcard, Topic } from '@/types'

/**
 * Topic Detail page
 * Shows concept explanation, flashcards, questions, vocabulary, and notes
 */
export function TopicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [explanationLevel, setExplanationLevel] = useState<'eli5' | 'beginner' | 'intermediate' | 'advanced'>('eli5')
  const [notes, setNotes] = useState('')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [vocabulary, setVocabulary] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)

  useEffect(() => {
    if (id) {
      loadTopicData()
      loadNotes()
    }
  }, [id])

  const loadTopicData = async () => {
    if (!id) return

    setIsLoading(true)

    // Load topic
    const { topic: topicData, error: topicError } = await getTopic(id)
    if (topicError || !topicData) {
      console.error('Failed to load topic:', topicError)
      setIsLoading(false)
      return
    }

    setTopic(topicData)

    // Load related content in parallel
    const [flashcardsResult, questionsResult, explanationsResult, vocabResult] = await Promise.all([
      getTopicFlashcards(id),
      getTopicQuestions(id),
      getTopicExplanations(id),
      getDocumentVocabulary(topicData.documentId),
    ])

    setFlashcards((flashcardsResult.flashcards || []) as Flashcard[])
    setQuestions(questionsResult.questions || [])

    // Organize explanations by level
    const explanationsMap: Record<string, string> = {}
    ;(explanationsResult.explanations || []).forEach((exp: any) => {
      explanationsMap[exp.explanation_level] = exp.explanation_text
    })
    setExplanations(explanationsMap)

    setVocabulary(vocabResult.vocabulary || [])
    setIsLoading(false)
  }

  const loadNotes = async () => {
    if (!id) return

    const { data } = await supabase
      .from('user_notes')
      .select('note_text')
      .eq('topic_id', id)
      .single()

    if (data) {
      const noteData = data as { note_text: string }
      setNotes(noteData.note_text)
    }
  }

  const saveNotes = async () => {
    if (!id || !topic) return

    const user = await supabase.auth.getUser()
    if (!user.data.user) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('user_notes') as any)
      .upsert({
        user_id: user.data.user.id,
        topic_id: id,
        note_text: notes,
      })

    if (error) {
      console.error('Failed to save notes:', error)
    }
  }

  const { toast } = useToast()

  const handleGenerateMoreQuestions = async () => {
    if (!id) return

    setIsGeneratingQuestions(true)
    const { questionsGenerated, error } = await generateMoreQuestionsForTopic(id)

    if (error) {
      toast({
        title: 'Failed to generate questions',
        description: error,
        variant: 'error',
      })
      setIsGeneratingQuestions(false)
      return
    }

    // Reload questions
    const { questions: newQuestions } = await getTopicQuestions(id)
    setQuestions(newQuestions || [])

    toast({
      title: 'Questions generated!',
      description: `Successfully generated ${questionsGenerated} new questions.`,
      variant: 'success',
    })

    setIsGeneratingQuestions(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-foreground-secondary">Loading topic...</p>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-foreground-secondary">Topic not found</p>
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
            <Link to={`/documents/${topic.documentId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Document
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold">{topic.title}</h1>
          <p className="text-foreground-secondary">{topic.description || 'No description'}</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Pages {Array.isArray(topic.pageReferences) ? topic.pageReferences.join(', ') : 'N/A'}
            </Badge>
            <Badge variant="outline">In Progress</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link to={`/topics/${id}/flashcards`}>
              <BookOpen className="mr-2 h-4 w-4" />
              Study Flashcards
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/topics/${id}/questions`}>
              <Play className="mr-2 h-4 w-4" />
              Take Quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="concept" className="space-y-6">
        <TabsList>
          <TabsTrigger value="concept">Concept</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Concept Explanation */}
        <TabsContent value="concept" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Concept Explanation</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={explanationLevel === 'eli5' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setExplanationLevel('eli5')}
                  >
                    ELI5
                  </Button>
                  <Button
                    variant={explanationLevel === 'beginner' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setExplanationLevel('beginner')}
                  >
                    Beginner
                  </Button>
                  <Button
                    variant={explanationLevel === 'intermediate' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setExplanationLevel('intermediate')}
                  >
                    Intermediate
                  </Button>
                  <Button
                    variant={explanationLevel === 'advanced' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setExplanationLevel('advanced')}
                  >
                    Advanced
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">
                {explanations[explanationLevel] || 'Explanation not available for this level yet.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flashcards */}
        <TabsContent value="flashcards" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Flashcards</CardTitle>
                  <CardDescription>{flashcards.length} cards available</CardDescription>
                </div>
                <Button asChild>
                  <Link to={`/study/flashcards/${id}`}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Session
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flashcards.map((card) => (
                  <Card key={card.id} className="bg-background-tertiary">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{card.difficultyLevel}</Badge>
                          {card.aiGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{card.frontText}</p>
                        <p className="text-sm text-foreground-secondary">{card.backText}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Practice Questions</CardTitle>
                  <CardDescription>
                    {questions.length} {questions.length === 1 ? 'question' : 'questions'} available
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleGenerateMoreQuestions}
                    disabled={isGeneratingQuestions}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isGeneratingQuestions ? 'Generating...' : 'Generate More'}
                  </Button>
                  {questions.length > 0 && (
                    <Button asChild>
                      <Link to={`/study/questions/${id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Start Quiz
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="space-y-4 text-center">
                  <p className="text-foreground-secondary">
                    No questions available yet. Generate questions to start practicing.
                  </p>
                  <Button onClick={handleGenerateMoreQuestions} disabled={isGeneratingQuestions}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isGeneratingQuestions ? 'Generating...' : 'Generate Questions'}
                  </Button>
                  <p className="text-xs text-foreground-tertiary">
                    This will use 3 Study Credits
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-foreground-secondary">
                    Practice questions help reinforce your understanding through active recall.
                  </p>
                  <div className="space-y-3">
                    {questions.map((question) => (
                      <Card key={question.id} className="bg-background-tertiary">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{question.question_type}</Badge>
                              {question.ai_generated && (
                                <Badge variant="secondary" className="text-xs">
                                  AI Generated
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium">{question.question_text}</p>
                            {question.question_type === 'mcq' && question.options && (
                              <div className="mt-2 space-y-1 text-sm">
                                {Object.entries(question.options as Record<string, string>).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className={`rounded p-2 ${
                                        key === question.correct_answer
                                          ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
                                          : 'bg-background-secondary'
                                      }`}
                                    >
                                      <span className="font-medium">{key.toUpperCase()}.</span> {value}
                                      {key === question.correct_answer && (
                                        <Badge variant="default" className="ml-2 text-xs">
                                          Correct
                                        </Badge>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                            {question.explanation && (
                              <p className="mt-2 text-sm text-foreground-secondary">
                                <strong>Explanation:</strong> {question.explanation}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vocabulary */}
        <TabsContent value="vocabulary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vocabulary Terms</CardTitle>
              <CardDescription>Key terms from this topic</CardDescription>
            </CardHeader>
            <CardContent>
              {vocabulary.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {vocabulary.map((term) => (
                    <AccordionItem key={term.id} value={term.id}>
                      <AccordionTrigger>{term.term}</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <p>{term.definition}</p>
                          {term.etymology && (
                            <p className="text-sm text-foreground-secondary">
                              <strong>Etymology:</strong> {term.etymology}
                            </p>
                          )}
                          {term.pronunciation && (
                            <p className="text-sm text-foreground-secondary">
                              <strong>Pronunciation:</strong> {term.pronunciation}
                            </p>
                          )}
                          {term.context_sentences && term.context_sentences.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Context:</p>
                              <ul className="list-disc list-inside text-sm text-foreground-secondary">
                                {term.context_sentences.map((sentence: string, idx: number) => (
                                  <li key={idx}>{sentence}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-foreground-secondary">No vocabulary terms available for this topic.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Notes</CardTitle>
              <CardDescription>Add your own notes and insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Write your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[200px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setNotes('')}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear
                </Button>
                <Button onClick={saveNotes}>Save Notes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

