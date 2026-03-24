import { SwipeFileClient } from '@/components/feed/SwipeFileClient'
import { Header } from '@/components/layout/Header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Swipe File' }

export default function SwipeFilePage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Swipe File"
        description="Vos publicités sauvegardées pour vous inspirer"
      />
      <div className="flex-1 min-h-0 overflow-auto">
        <SwipeFileClient />
      </div>
    </div>
  )
}
