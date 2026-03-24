import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWeeklyDigestForOrg } from '@/actions/digest'

// Called by Vercel Cron every Monday at 8:00 UTC
export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.APP_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgs = await prisma.organization.findMany({
    where: { weeklyDigest: true },
    select: { id: true },
  })

  const results = await Promise.allSettled(
    orgs.map((org) => sendWeeklyDigestForOrg(org.id))
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ sent, failed, total: orgs.length })
}

// Vercel Cron uses GET for scheduled invocations
export async function GET(req: Request) {
  return POST(req)
}
