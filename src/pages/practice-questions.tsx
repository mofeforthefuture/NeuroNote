import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface Question {
  id: string
  question: string
  type: 'multiple_choice' | 'short_answer'
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
}

/**
 * Practice Questions page
 * One question at a time with immediate feedback
 */
export function PracticeQuestionsPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // TODO: Fetch questions from API
  const questions: Question[] = [
    {
      id: '1',
      question: 'What is the primary function of a neuron?',
      type: 'multiple_choice',
      options: [
        'To store memories',
        'To transmit nerve impulses',
        'To produce hormones',
        'To digest food',
      ],
      correctAnswer: 'To transmit nerve impulses',
      explanation: 'Neurons are specialized cells designed to transmit electrical and chemical signals throughout the nervous system.',
    },
    {
      id: '2',
      question: 'Where do neurons communicate with each other?',
      type: 'multiple_choice',
      options: ['At the cell body', 'At synapses', 'In the nucleus', 'At the axon'],
      correctAnswer: 'At synapses',
      explanation: 'Synapses are the specialized junctions where neurons communicate with each other.',
    },
  ]

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return
    setSelectedAnswer(answer)
  }

  const handleSubmit = () => {
    if (!selectedAnswer) return

    const correct = Array.isArray(currentQuestion.correctAnswer)
      ? currentQuestion.correctAnswer.includes(selectedAnswer as string)
      : selectedAnswer === currentQuestion.correctAnswer

    setIsCorrect(correct)
    setShowFeedback(true)

    // TODO: Update progress in backend
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
      setIsCorrect(false)
    } else {
      // Quiz complete
      navigate(`/topics/${topicId}?quiz=complete`)
    }
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-foreground-secondary">No questions available</p>
            <Button asChild>
              <Link to={`/topics/${topicId}`}>Back to Topic</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/topics/${topicId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Quiz
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground-secondary">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <Progress value={progress} className="w-32" />
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{currentQuestion.question}</CardTitle>
            <Badge variant="secondary">{currentQuestion.type.replace('_', ' ')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option
                const isCorrectOption = option === currentQuestion.correctAnswer
                const showResult = showFeedback && (isSelected || isCorrectOption)

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showFeedback}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      showResult
                        ? isCorrectOption
                          ? 'border-success bg-success/10'
                          : isSelected
                          ? 'border-error bg-error/10'
                          : 'border-border'
                        : isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-border-hover hover:bg-background-tertiary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-border'
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-foreground-inverse" />
                        )}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showResult && (
                        <>
                          {isCorrectOption && (
                            <Check className="h-5 w-5 text-success" />
                          )}
                          {isSelected && !isCorrectOption && (
                            <X className="h-5 w-5 text-error" />
                          )}
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {showFeedback && currentQuestion.explanation && (
            <div
              className={`rounded-lg border p-4 ${
                isCorrect
                  ? 'border-success bg-success/10 text-success'
                  : 'border-error bg-error/10 text-error'
              }`}
            >
              <p className="font-medium">
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              <p className="mt-2 text-sm">{currentQuestion.explanation}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            {!showFeedback ? (
              <Button onClick={handleSubmit} disabled={!selectedAnswer}>
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

