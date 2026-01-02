/**
 * Credit Balance Display Component
 * Shows current credit balance with link to purchase/history
 */

import { useEffect, useState } from 'react'
import { Coins, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCreditBalance, type CreditBalance as CreditBalanceType } from '@/lib/credits'
import { getCurrentUser } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface CreditBalanceProps {
  showDetails?: boolean
  className?: string
  onBuyClick?: () => void
  onHistoryClick?: () => void
}

export function CreditBalance({ 
  showDetails = false, 
  className,
  onBuyClick,
  onHistoryClick 
}: CreditBalanceProps) {
  const [balance, setBalance] = useState<CreditBalanceType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBalance()
  }, [])

  async function loadBalance() {
    setLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) {
        // Default to 0 if no user
        setBalance({ balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 })
        setLoading(false)
        return
      }

      const { balance: creditBalance, error } = await getCreditBalance(user.id)
      if (error) {
        console.error('Failed to load balance:', error)
        // Default to 0 on error
        setBalance({ balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 })
        setLoading(false)
        return
      }

      // If no balance record exists, default to 0
      setBalance(creditBalance || { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 })
    } catch (error) {
      console.error('Error loading balance:', error)
      // Default to 0 on error
      setBalance({ balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 })
    } finally {
      setLoading(false)
    }
  }

  // Default to 0 if no balance loaded yet
  const displayBalance = balance || { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 }

  if (loading) {
    // Show 0 while loading instead of "Loading..."
    const isCompact = className?.includes('bg-transparent') || className?.includes('p-0')
    
    if (isCompact) {
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <div className="rounded-full p-1.5 bg-blue-50 dark:bg-blue-950/20">
            <Coins className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-foreground-primary">0</span>
            <span className="text-xs text-foreground-secondary">Credits</span>
          </div>
          {onBuyClick && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onBuyClick}
              className="h-7 text-xs px-2"
            >
              Buy
            </Button>
          )}
        </div>
      )
    }
    
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-blue-50 dark:bg-blue-950/20">
              <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold">0</span>
                <span className="text-sm text-foreground-secondary">Credits</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isLowBalance = displayBalance.balance < 50
  const isCriticalBalance = displayBalance.balance < 20

  // Compact mode (no card wrapper)
  const isCompact = className?.includes('bg-transparent') || className?.includes('p-0')
  
  if (isCompact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'rounded-full p-1.5',
          isCriticalBalance ? 'bg-amber-100 dark:bg-amber-900/30' :
          isLowBalance ? 'bg-amber-50 dark:bg-amber-950/20' :
          'bg-blue-50 dark:bg-blue-950/20'
        )}>
          <Coins className={cn(
            'h-4 w-4',
            isCriticalBalance ? 'text-amber-600 dark:text-amber-400' :
            isLowBalance ? 'text-amber-500 dark:text-amber-500' :
            'text-blue-600 dark:text-blue-400'
          )} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={cn(
            'font-semibold',
            isCriticalBalance ? 'text-amber-600 dark:text-amber-400' :
            isLowBalance ? 'text-amber-500' : 'text-foreground-primary'
          )}>
            {displayBalance.balance}
          </span>
          <span className="text-xs text-foreground-secondary">Credits</span>
        </div>
        {onBuyClick && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onBuyClick}
            className={cn(
              'h-7 text-xs px-2',
              isLowBalance && 'text-amber-600 hover:text-amber-700 dark:text-amber-400'
            )}
          >
            {isLowBalance ? 'Buy' : 'Add'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={cn(
      'border-dashed transition-colors',
      isCriticalBalance && 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20',
      isLowBalance && !isCriticalBalance && 'border-amber-400/30',
      className
    )}>
      <CardContent className={cn('p-4', className?.includes('p-3') && 'p-3', className?.includes('p-2') && 'p-2')}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'rounded-full p-2',
                isCriticalBalance ? 'bg-amber-100 dark:bg-amber-900/30' :
                isLowBalance ? 'bg-amber-50 dark:bg-amber-950/20' :
                'bg-blue-50 dark:bg-blue-950/20'
              )}>
                <Coins className={cn(
                  'h-5 w-5',
                  isCriticalBalance ? 'text-amber-600 dark:text-amber-400' :
                  isLowBalance ? 'text-amber-500 dark:text-amber-500' :
                  'text-blue-600 dark:text-blue-400'
                )} />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{displayBalance.balance}</span>
                  <span className="text-sm text-foreground-secondary">Credits</span>
                </div>
                {showDetails && (
                  <div className="mt-1 text-xs text-foreground-tertiary">
                    {isLowBalance && (
                      <span className={cn(
                        isCriticalBalance ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500'
                      )}>
                        {isCriticalBalance ? 'Low balance' : 'Getting low'}
                      </span>
                    )}
                    {!isLowBalance && (
                      <span className="text-foreground-tertiary">
                        Credits never expire
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onHistoryClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onHistoryClick}
                className="text-xs flex-1"
              >
                History
              </Button>
            )}
            {onBuyClick && (
              <Button
                size="sm"
                onClick={onBuyClick}
                className={cn(
                  'text-xs flex-1',
                  isLowBalance && 'bg-amber-500 hover:bg-amber-600 text-white'
                )}
              >
                {isLowBalance ? 'Buy Credits' : 'Add Credits'}
              </Button>
            )}
          </div>
        </div>
        {showDetails && displayBalance.lifetimeEarned > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs text-foreground-secondary">
              <span>Lifetime earned</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {displayBalance.lifetimeEarned}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

