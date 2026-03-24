import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/Sidebar'
import { ThemeProvider } from '@/components/ThemeProvider'
import type { Plan } from '@prisma/client'

async function getOrgPlan(): Promise<Plan> {
  const { userId } = await auth()
  if (!userId) return 'FREE'
  const org = await prisma.organization.findFirst({
    where: { clerkOrgId: userId },
    select: { plan: true },
  })
  return org?.plan ?? 'FREE'
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const plan = await getOrgPlan()

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar plan={plan} />
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
