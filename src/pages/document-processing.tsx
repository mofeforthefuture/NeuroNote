import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

/**
 * Document Processing page
 * Shows processing status with clear feedback
 */
export function DocumentProcessingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileName = searchParams.get('file') || 'document'
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'processing' | 'completed'>('processing')
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    'Uploading document...',
    'Extracting text and structure...',
    'Identifying topics and concepts...',
    'Generating flashcards...',
    'Creating practice questions...',
    'Finalizing your study materials...',
  ]

  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setStatus('completed')
            return 100
          }
          return prev + 2
        })
      }, 100)

      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(stepInterval)
            return steps.length - 1
          }
          return prev + 1
        })
      }, 2000)

      return () => {
        clearInterval(interval)
        clearInterval(stepInterval)
      }
    }
  }, [status, steps.length])

  const handleContinue = () => {
    // TODO: Navigate to actual document ID
    navigate('/documents/1')
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          {status === 'processing' ? (
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          ) : (
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success" />
          )}
          <CardTitle className="text-2xl">
            {status === 'processing' ? 'Processing Your Document' : 'Document Ready!'}
          </CardTitle>
          <CardDescription>
            {status === 'processing'
              ? steps[currentStep]
              : 'Your document has been processed and is ready for study'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-secondary">{fileName}</span>
              <span className="text-foreground-secondary">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {status === 'processing' && (
            <div className="space-y-2">
              <p className="text-sm text-foreground-secondary">
                Estimated time: {Math.ceil((100 - progress) / 2)} seconds remaining
              </p>
              <p className="text-xs text-foreground-tertiary">
                This may take 2-5 minutes for new documents. Popular documents process instantly.
              </p>
            </div>
          )}

          {status === 'completed' && (
            <div className="space-y-4">
              <p className="text-sm text-foreground-secondary">
                Your document has been transformed into study materials including:
              </p>
              <ul className="list-disc space-y-1 pl-6 text-sm text-foreground-secondary">
                <li>Topics and key concepts</li>
                <li>Interactive flashcards</li>
                <li>Practice questions</li>
                <li>Vocabulary terms</li>
              </ul>
              <Button onClick={handleContinue} className="w-full">
                Start Exploring
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

