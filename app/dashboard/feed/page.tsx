import { Header } from '@/components/layout/Header'
import { FeedClient } from '@/components/feed/FeedClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Découvrir' }

export default function FeedPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Découvrir"
        description="Publicités de toutes les marques pour vous inspirer"
      />
      <div className="flex-1 min-h-0 overflow-auto">
        <FeedClient />
      </div>
    </div>
  )
}
