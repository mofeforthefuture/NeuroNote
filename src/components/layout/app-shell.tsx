import { ReactNode } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'

interface AppShellProps {
  children: ReactNode
}

/**
 * Main application shell component
 * Provides consistent layout structure with header and sidebar
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="container mx-auto max-w-7xl p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

