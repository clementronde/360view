import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

type ClerkEvent = {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
    username?: string
    organization_memberships?: Array<{
      organization: { id: string; name: string; slug: string }
    }>
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // Verify Svix signature
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.text()
  const wh = new Webhook(webhookSecret)

  let event: ClerkEvent
  try {
    event = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkEvent
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle user creation — provision org
  if (event.type === 'user.created') {
    const userId = event.data.id
    const name =
      [event.data.first_name, event.data.last_name].filter(Boolean).join(' ') ||
      event.data.username ||
      'Mon espace'

    const slug = `org-${userId.slice(-8)}`

    await prisma.organization.upsert({
      where: { clerkOrgId: userId },
      create: {
        clerkOrgId: userId,
        name,
        slug,
      },
      update: { name },
    })
  }

  return NextResponse.json({ received: true })
}
