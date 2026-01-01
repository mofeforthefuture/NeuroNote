import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Textarea } from '@/components/ui/textarea'
import type { Flashcard } from '@/types'

/**
 * Topic Detail page
 * Shows concept explanation, flashcards, questions, vocabulary, and notes
 */
export function TopicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [explanationLevel, setExplanationLevel] = useState<'eli5' | 'intermediate' | 'advanced'>('eli5')
  const [notes, setNotes] = useState('')

  // TODO: Fetch topic data from API
  const topic = {
    id: id || '1',
    title: 'Neurons and Synapses',
    description: 'Understanding the basic building blocks of the nervous system',
    pageReferences: [1, 2, 3],
  }

  const explanations = {
    eli5: 'Neurons are like tiny messengers in your brain. They send signals to each other through connections called synapses, like passing notes in class.',
    intermediate: 'Neurons are specialized cells that transmit electrical and chemical signals. Synapses are the junctions where neurons communicate, using neurotransmitters to relay information.',
    advanced: 'Neurons are excitable cells that process and transmit information through electrical and chemical signaling. Synapses are specialized structures where the axon terminal of one neuron communicates with the dendrite of another, utilizing neurotransmitters released from synaptic vesicles.',
  }

  const flashcards: Flashcard[] = [
    {
      id: '1',
      topicId: id || '1',
      frontText: 'What is a neuron?',
      backText: 'A specialized cell that transmits nerve impulses',
      difficultyLevel: 'easy',
      aiGenerated: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      topicId: id || '1',
      frontText: 'What is a synapse?',
      backText: 'The junction between two neurons where signals are transmitted',
      difficultyLevel: 'medium',
      aiGenerated: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/documents/1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Document
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold">{topic.title}</h1>
          <p className="text-foreground-secondary">{topic.description}</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Pages {topic.pageReferences.join(', ')}</Badge>
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
              <p className="text-lg leading-relaxed">{explanations[explanationLevel]}</p>
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
                  <Link to={`/topics/${id}/flashcards`}>
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
                  <CardDescription>6 questions available</CardDescription>
                </div>
                <Button asChild>
                  <Link to={`/topics/${id}/questions`}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Quiz
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-secondary">
                Practice questions help reinforce your understanding through active recall.
              </p>
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
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="neuron">
                  <AccordionTrigger>Neuron</AccordionTrigger>
                  <AccordionContent>
                    A specialized cell that transmits nerve impulses; the basic building block of
                    the nervous system.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="synapse">
                  <AccordionTrigger>Synapse</AccordionTrigger>
                  <AccordionContent>
                    The junction between two neurons where signals are transmitted from one neuron
                    to another.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="neurotransmitter">
                  <AccordionTrigger>Neurotransmitter</AccordionTrigger>
                  <AccordionContent>
                    Chemical messengers that transmit signals across synapses from one neuron to
                    another.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
                <Button onClick={() => {/* TODO: Save notes */}}>Save Notes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

