import { Suspense } from 'react'
import { Users2, Search } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { AddCompetitorDialog } from '@/components/competitors/AddCompetitorDialog'
import { CompetitorCard } from '@/components/competitors/CompetitorCard'
import { getCompetitors } from '@/actions/competitors'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Concurrents' }

async function CompetitorsList() {
  const competitors = await getCompetitors()

  if (competitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
          <Users2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold">Aucun concurrent suivi</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Ajoutez vos premiers concurrents pour commencer la veille automatisée.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {competitors.map((competitor) => (
        <CompetitorCard key={competitor.id} competitor={competitor} />
      ))}
    </div>
  )
}

export default function ConcurrentsPage() {
  return (
    <div className="flex flex-col overflow-auto">
      <Header
        title="Concurrents"
        description="Gérez les entreprises à surveiller"
        actions={<AddCompetitorDialog />}
      />
      <div className="flex-1 overflow-auto p-6">
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          }
        >
          <CompetitorsList />
        </Suspense>
      </div>
    </div>
  )
}
