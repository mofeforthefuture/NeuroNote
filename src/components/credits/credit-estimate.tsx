/**
 * Credit Estimate Component
 * Shows estimated credit cost before processing
 */

import { Coins, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type CreditEstimate } from '@/lib/credits'
import { cn } from '@/lib/utils'

interface CreditEstimateProps {
  estimate: CreditEstimate
  currentBalance: number
  className?: string
}

export function CreditEstimate({ estimate, currentBalance, className }: CreditEstimateProps) {
  const hasEnoughCredits = currentBalance >= estimate.total

  return (
    <Card className={cn('border-dashed', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Estimated Cost
          </CardTitle>
          <Badge 
            variant={hasEnoughCredits ? 'default' : 'warning'}
            className={cn(
              hasEnoughCredits && 'bg-green-500 hover:bg-green-600',
              !hasEnoughCredits && 'bg-amber-500 hover:bg-amber-600'
            )}
          >
            {estimate.total} credits
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {hasEnoughCredits 
            ? 'You have enough credits to proceed'
            : `You need ${estimate.total - currentBalance} more credits`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary">Processing</span>
            <span className="font-medium">{estimate.processing} credits</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary">Flashcards</span>
            <span className="font-medium">{estimate.flashcards} credits</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary">Questions</span>
            <span className="font-medium">{estimate.questions} credits</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary">Vocabulary</span>
            <span className="font-medium">{estimate.vocabulary} credit</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary">Explanations</span>
            <span className="font-medium">{estimate.explanations} credits</span>
          </div>
          <div className="pt-2 mt-2 border-t border-border">
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{estimate.total} credits</span>
            </div>
          </div>
        </div>
        {!hasEnoughCredits && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Insufficient credits</p>
                <p>You have {currentBalance} credits, but need {estimate.total}. Buy more credits to continue processing.</p>
              </div>
            </div>
          </div>
        )}
        {hasEnoughCredits && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p>If processing fails, credits will be automatically refunded.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

