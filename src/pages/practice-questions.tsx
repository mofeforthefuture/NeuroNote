import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { getTopicQuestions } from '@/lib/topics'
import { updateQuestionProgress } from '@/lib/study-session'
import { useToast } from '@/components/ui/use-toast'

interface Question {
  id: string
  question_text: string
  question_type: 'mcq' | 'short_answer' | 'true_false' | 'essay'
  options?: Record<string, string> | null
  correct_answer: string
  explanation?: string | null
}

/**
 * Practice Questions page
 * One question at a time with immediate feedback
 */
export function PracticeQuestionsPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (topicId) {
      loadQuestions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId])

  const loadQuestions = async () => {
    if (!topicId) return

    setIsLoading(true)
    const { questions: qs, error } = await getTopicQuestions(topicId)

    if (error) {
      console.error('Failed to load questions:', error)
    } else {
      setQuestions((qs || []) as Question[])
    }

    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-foreground-secondary">Loading questions...</p>
      </div>
    )
  }

  if (questions.length === 0) {
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

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  // Convert options object to array for MCQ (preserve keys for comparison)
  const optionsArray =
    currentQuestion.question_type === 'mcq' && currentQuestion.options
      ? Object.entries(currentQuestion.options).map(([key, value]) => ({ key, value }))
      : []

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return
    setSelectedAnswer(answer)
  }

  const handleSubmit = async () => {
    if (!selectedAnswer || isUpdating) return

    // For MCQ, correct_answer is the option key (e.g., "a", "b", "c", "d")
    // For true_false, correct_answer is "true" or "false"
    // For short_answer, correct_answer is the text answer
    let correct = false
    const answerStr = Array.isArray(selectedAnswer) ? selectedAnswer[0] : selectedAnswer

    if (currentQuestion.question_type === 'mcq') {
      // Compare the selected option key with the correct answer key
      correct = answerStr === currentQuestion.correct_answer
    } else if (currentQuestion.question_type === 'true_false') {
      // Compare the selected answer (true/false) with correct_answer
      correct = answerStr?.toLowerCase() === currentQuestion.correct_answer.toLowerCase()
    } else {
      // For short_answer and essay, compare text (case-insensitive)
      correct =
        String(answerStr || '')
          .toLowerCase()
          .trim() === String(currentQuestion.correct_answer).toLowerCase().trim()
    }

    setIsCorrect(correct)
    setShowFeedback(true)
    setIsUpdating(true)

    // Update progress in backend
    const { error } = await updateQuestionProgress(currentQuestion.id, correct)
    if (error) {
      console.error('Failed to update progress:', error)
      toast({
        title: 'Progress update failed',
        description: error,
        variant: 'error',
      })
    }

    setIsUpdating(false)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
      setIsCorrect(false)
    } else {
      // Quiz complete
      toast({
        title: 'Quiz complete!',
        description: `You answered ${questions.length} questions`,
        variant: 'success',
      })
      setTimeout(() => {
        navigate(`/topics/${topicId}?quiz=complete`)
      }, 1500)
    }
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
            <CardTitle className="text-2xl">{currentQuestion.question_text}</CardTitle>
            <Badge variant="secondary">{currentQuestion.question_type.replace('_', ' ')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.question_type === 'mcq' && optionsArray.length > 0 && (
            <div className="space-y-3">
              {optionsArray.map((option, index) => {
                const isSelected = selectedAnswer === option.key
                const isCorrectOption = option.key === currentQuestion.correct_answer
                const showResult = showFeedback && (isSelected || isCorrectOption)

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option.key)}
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
                          isSelected ? 'border-primary bg-primary' : 'border-border'
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-foreground-inverse" />
                        )}
                      </div>
                      <span className="flex-1">
                        <span className="font-medium">{option.key.toUpperCase()}.</span>{' '}
                        {option.value}
                      </span>
                      {showResult && (
                        <>
                          {isCorrectOption && <Check className="h-5 w-5 text-success" />}
                          {isSelected && !isCorrectOption && <X className="h-5 w-5 text-error" />}
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {currentQuestion.question_type === 'true_false' && (
            <div className="space-y-3">
              {['true', 'false'].map(option => {
                const isSelected = selectedAnswer === option
                const isCorrectOption =
                  option.toLowerCase() === currentQuestion.correct_answer.toLowerCase()
                const showResult = showFeedback && (isSelected || isCorrectOption)

                return (
                  <button
                    key={option}
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
                          isSelected ? 'border-primary bg-primary' : 'border-border'
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-foreground-inverse" />
                        )}
                      </div>
                      <span className="flex-1 font-medium capitalize">{option}</span>
                      {showResult && (
                        <>
                          {isCorrectOption && <Check className="h-5 w-5 text-success" />}
                          {isSelected && !isCorrectOption && <X className="h-5 w-5 text-error" />}
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {(currentQuestion.question_type === 'short_answer' ||
            currentQuestion.question_type === 'essay') && (
            <div className="space-y-2">
              <textarea
                value={(selectedAnswer as string) || ''}
                onChange={e => handleAnswerSelect(e.target.value)}
                disabled={showFeedback}
                placeholder="Type your answer here..."
                className="min-h-[120px] w-full rounded-lg border border-border bg-background-primary p-4 text-foreground-primary placeholder:text-foreground-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
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
              <p className="font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
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
