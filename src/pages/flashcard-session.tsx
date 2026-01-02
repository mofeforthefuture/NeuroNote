import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { getTopicFlashcards } from '@/lib/topics'
import { updateFlashcardProgress } from '@/lib/study-session'
import { useToast } from '@/components/ui/use-toast'
import type { Flashcard } from '@/types'

/**
 * Flashcard Session page
 * Full-screen flashcard study experience
 */
export function FlashcardSessionPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set())
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (topicId) {
      loadFlashcards()
    }
  }, [topicId])

  const loadFlashcards = async () => {
    if (!topicId) return

    setIsLoading(true)
    const { flashcards: cards, error } = await getTopicFlashcards(topicId)

    if (error) {
      console.error('Failed to load flashcards:', error)
    } else {
      setFlashcards((cards || []) as Flashcard[])
    }

    setIsLoading(false)
  }

  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleResponse = async (gotIt: boolean) => {
    if (!currentCard || isUpdating) return

    setIsUpdating(true)
    setReviewedCards((prev) => new Set(prev).add(currentCard.id))

    // Update progress in backend
    const { error } = await updateFlashcardProgress(currentCard.id, gotIt)
    if (error) {
      console.error('Failed to update progress:', error)
      toast({
        title: 'Progress update failed',
        description: error,
        variant: 'error',
      })
    }

    setIsUpdating(false)

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    } else {
      // Session complete
      toast({
        title: 'Session complete!',
        description: `You reviewed ${reviewedCards.size + 1} flashcards`,
        variant: 'success',
      })
      setTimeout(() => {
        navigate(`/topics/${topicId}?session=complete`)
      }, 1500)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-foreground-secondary">Loading flashcards...</p>
      </div>
    )
  }

  if (flashcards.length === 0) {
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

  const currentCard = flashcards[currentIndex]
  if (!currentCard) {
    return null
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

