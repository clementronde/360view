import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { PricingCards } from '@/components/upgrade/PricingCards'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Plans & Tarifs' }

export default async function UpgradePage() {
  const { userId } = await auth()
  const org = userId
    ? await prisma.organization.findFirst({
        where: { clerkOrgId: userId },
        select: { plan: true },
      })
    : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Plans & Tarifs"
        description="Choisissez le plan adapté à votre activité"
      />
      <div className="flex-1 overflow-auto p-4 lg:p-8">
        <PricingCards currentPlan={org?.plan ?? 'FREE'} />
      </div>
    </div>
  )
}
