import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { Flashcard } from '@/types'

/**
 * Flashcard Session page
 * Full-screen flashcard study experience
 */
export function FlashcardSessionPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [, setReviewedCards] = useState<Set<string>>(new Set())

  // TODO: Fetch flashcards from API
  const flashcards: Flashcard[] = [
    {
      id: '1',
      topicId: topicId || '1',
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
      topicId: topicId || '1',
      frontText: 'What is a synapse?',
      backText: 'The junction between two neurons where signals are transmitted',
      difficultyLevel: 'medium',
      aiGenerated: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      topicId: topicId || '1',
      frontText: 'What are neurotransmitters?',
      backText: 'Chemical messengers that transmit signals across synapses',
      difficultyLevel: 'hard',
      aiGenerated: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleResponse = (_gotIt: boolean) => {
    if (currentCard) {
      setReviewedCards((prev) => new Set(prev).add(currentCard.id))
      
      // TODO: Update progress in backend
      
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setIsFlipped(false)
      } else {
        // Session complete
        navigate(`/topics/${topicId}?session=complete`)
      }
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  if (!currentCard) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-foreground-secondary">No flashcards available</p>
            <Button asChild>
              <Link to={`/topics/${topicId}`}>Back to Topic</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background-secondary/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/topics/${topicId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit Session
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground-secondary">
              {currentIndex + 1} of {flashcards.length}
            </span>
            <Progress value={progress} className="w-32" />
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <Card
            className={`cursor-pointer transition-all duration-300 ${
              isFlipped ? 'bg-background-tertiary' : ''
            }`}
            onClick={handleFlip}
          >
            <CardContent className="flex min-h-[400px] items-center justify-center p-12">
              <div className="text-center">
                <Badge variant="secondary" className="mb-4">
                  {currentCard.difficultyLevel}
                </Badge>
                <p className="text-2xl leading-relaxed">
                  {isFlipped ? currentCard.backText : currentCard.frontText}
                </p>
                <p className="mt-4 text-sm text-foreground-secondary">
                  {isFlipped ? 'Click to flip back' : 'Click to reveal answer'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {isFlipped && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                onClick={() => handleResponse(false)}
                className="flex-1 max-w-xs"
              >
                <X className="mr-2 h-4 w-4" />
                Need Practice
              </Button>
              <Button
                onClick={() => handleResponse(true)}
                className="flex-1 max-w-xs"
              >
                <Check className="mr-2 h-4 w-4" />
                Got It
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button variant="ghost" onClick={handleFlip}>
              {isFlipped ? 'Flip Back' : 'Flip Card'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

