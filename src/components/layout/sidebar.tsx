import { FileText, GraduationCap, Home, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { CreditBalance } from '@/components/credits/credit-balance'
import { useState } from 'react'
import { BuyCreditsModal } from '@/components/credits/buy-credits-modal'

const navigation = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Documents', href: '/dashboard', icon: FileText },
  { name: 'Progress', href: '/progress', icon: GraduationCap },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

/**
 * Sidebar navigation component
 * Provides main navigation links with active state indication
 */
export function Sidebar() {
  const location = useLocation()
  const [showBuyModal, setShowBuyModal] = useState(false)

  return (
    <>
      <aside className="hidden w-64 border-r border-border bg-background-secondary lg:flex lg:flex-col">
        <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">NeuroNote</span>
            </Link>
          </div>

          {/* Credit Balance */}
          <div className="border-b border-border px-3 py-3">
            <CreditBalance
              showDetails={true}
              onBuyClick={() => setShowBuyModal(true)}
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 pt-4 pb-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-background-tertiary text-foreground-primary'
                    : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground-primary'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <Separator />

        {/* Bottom Navigation */}
        <nav className="px-4 py-4">
          {bottomNavigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-background-tertiary text-foreground-primary'
                    : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground-primary'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>

    {/* Buy Credits Modal */}
    <BuyCreditsModal
      open={showBuyModal}
      onOpenChange={setShowBuyModal}
    />
    </>
  )
}

