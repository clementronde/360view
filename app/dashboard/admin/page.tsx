import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { getAdminStats } from '@/actions/admin'
import { AdminClient } from '@/components/admin/AdminClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminPage() {
  const { userId } = await auth()
  if (!userId) notFound()

  // Only accessible if userId matches ADMIN_CLERK_ID (or always accessible if not set)
  const adminId = process.env.ADMIN_CLERK_ID
  if (adminId && userId !== adminId) notFound()

  const stats = await getAdminStats()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Admin" description="Gestion du système" />
      <div className="flex-1 overflow-auto p-6">
        <AdminClient stats={stats} />
      </div>
    </div>
  )
}
