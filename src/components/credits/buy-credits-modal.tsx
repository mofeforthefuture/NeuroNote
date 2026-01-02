/**
 * Buy Credits Modal Component
 * Shows available credit packages for purchase
 */

import { useState, useEffect } from 'react'
import { Coins, Check, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCreditPackages, type CreditPackage } from '@/lib/credits'
import { getCurrentUser } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface BuyCreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPurchase?: (packageId: string) => void
}

export function BuyCreditsModal({ open, onOpenChange, onPurchase }: BuyCreditsModalProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadPackages()
    }
  }, [open])

  async function loadPackages() {
    setLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) return

      // Get user's country code from profile
      // TODO: Fetch from user_profiles table
      const userCountryCode = undefined // TODO: Get from profile

      const { packages: creditPackages, error } = await getCreditPackages(userCountryCode)
      if (error) {
        console.error('Failed to load packages:', error)
        return
      }

      setPackages(creditPackages)
    } catch (error) {
      console.error('Error loading packages:', error)
    } finally {
      setLoading(false)
    }
  }

  function handlePurchase(packageId: string) {
    setSelectedPackage(packageId)
    onPurchase?.(packageId)
    // TODO: Integrate with payment provider (Stripe/Flutterwave)
    // For now, just close modal
    onOpenChange(false)
  }

  function formatPrice(amount: number, currency: 'USD' | 'NGN'): string {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString('en-NG')}`
    }
    return `$${amount.toFixed(2)}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Buy Study Credits
          </DialogTitle>
          <DialogDescription>
            Credits never expire. Only pay for what you use. Studying is always free.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-foreground-secondary">
            Loading packages...
          </div>
        ) : packages.length === 0 ? (
          <div className="py-8 text-center text-foreground-secondary">
            No packages available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {packages.map((pkg) => {
              const totalCredits = pkg.credits + pkg.bonusCredits
              const pricePerCredit = pkg.priceAmount / totalCredits
              const isPopular = pkg.name === 'Student Bundle' || pkg.name === 'Scholar Pack'

              return (
                <Card
                  key={pkg.id}
                  className={cn(
                    'relative transition-all hover:border-primary cursor-pointer',
                    selectedPackage === pkg.id && 'border-primary ring-2 ring-primary/20',
                    isPopular && 'border-blue-500'
                  )}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  {isPopular && (
                    <Badge className="absolute -top-2 right-4 bg-blue-500">
                      Popular
                    </Badge>
                  )}
                  {pkg.bonusCredits > 0 && (
                    <div className="absolute -top-2 left-4">
                      <Badge className="bg-green-500 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        +{pkg.bonusCredits} free
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{totalCredits}</span>
                        <span className="text-sm text-foreground-secondary">credits</span>
                        {pkg.bonusCredits > 0 && (
                          <span className="text-xs text-foreground-tertiary">
                            ({pkg.credits} + {pkg.bonusCredits} bonus)
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">
                          {formatPrice(pkg.priceAmount, pkg.priceCurrency)}
                        </span>
                        <span className="text-xs text-foreground-tertiary">
                          {formatPrice(pricePerCredit, pkg.priceCurrency)} per credit
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePurchase(pkg.id)
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Select Package
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        <div className="mt-6 p-4 rounded-lg bg-background-tertiary border border-border">
          <div className="text-sm text-foreground-secondary space-y-2">
            <p className="font-medium text-foreground-primary">How Credits Work:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Credits are only used when AI processes documents</li>
              <li>Studying already-generated content is always free</li>
              <li>If processing fails, credits are automatically refunded</li>
              <li>Credits never expire</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

