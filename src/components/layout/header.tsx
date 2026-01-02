import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { CreditBalance } from '@/components/credits/credit-balance'
import { useState } from 'react'
import { BuyCreditsModal } from '@/components/credits/buy-credits-modal'

/**
 * Application header component
 * Provides navigation, search, and user actions
 */
export function Header() {
  const [showBuyModal, setShowBuyModal] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-background-secondary/60">
        <div className="container flex h-16 items-center justify-between px-4 lg:px-8">
          {/* Search */}
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
              <Input
                type="search"
                placeholder="Search documents, topics..."
                className="pl-10"
              />
            </div>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Credit Balance - Compact */}
          <div className="hidden md:flex items-center gap-2">
            <CreditBalance
              showDetails={false}
              onBuyClick={() => setShowBuyModal(true)}
              className="border-0 shadow-none bg-transparent p-0"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        open={showBuyModal}
        onOpenChange={setShowBuyModal}
      />
    </>
  )
}

