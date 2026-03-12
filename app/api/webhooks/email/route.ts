import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Inbound email webhook.
 * Compatible with Postmark, Mailgun, SendGrid and similar services.
 *
 * The webhook should send emails to the competitor's tracking email address.
 * We identify which competitor it belongs to by matching the `To` field.
 */

interface InboundEmailPayload {
  // Postmark format
  From?: string
  FromFull?: { Name: string; Email: string }
  To?: string
  Subject?: string
  TextBody?: string
  HtmlBody?: string
  // Mailgun format
  sender?: string
  recipient?: string
  subject?: string
  'body-plain'?: string
  'body-html'?: string
  // SendGrid format
  from?: string
  to?: string
}

function extractEmail(value: string): string {
  const match = value.match(/<([^>]+)>/)
  return match ? match[1].toLowerCase() : value.toLowerCase()
}

export async function POST(req: Request) {
  // Validate webhook secret
  const authHeader = req.headers.get('x-webhook-secret')
  if (authHeader !== process.env.EMAIL_WEBHOOK_SECRET && process.env.EMAIL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: InboundEmailPayload
  const contentType = req.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('application/json')) {
      payload = await req.json()
    } else {
      // Form-encoded (Mailgun, SendGrid)
      const formData = await req.formData()
      payload = Object.fromEntries(formData.entries()) as InboundEmailPayload
    }
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Extract fields (handle multiple formats)
  const toEmail = extractEmail(
    payload.To ?? payload.recipient ?? payload.to ?? ''
  )
  const fromEmail = extractEmail(
    payload.From ?? payload.sender ?? payload.from ?? ''
  )
  const fromName =
    payload.FromFull?.Name ?? fromEmail.split('@')[0]
  const subject = payload.Subject ?? payload.subject ?? '(Sans objet)'
  const textContent =
    payload.TextBody ?? payload['body-plain'] ?? undefined
  const htmlContent = payload.HtmlBody ?? payload['body-html'] ?? undefined

  if (!toEmail) {
    return NextResponse.json({ error: 'Missing To field' }, { status: 400 })
  }

  // Find competitor by tracking email
  const competitor = await prisma.competitor.findUnique({
    where: { trackingEmail: toEmail },
    include: { organization: true },
  })

  if (!competitor) {
    // Unknown tracking email — ignore silently
    return NextResponse.json({ received: true, matched: false })
  }

  // Save email
  await prisma.email.create({
    data: {
      competitorId: competitor.id,
      subject,
      fromName,
      fromEmail,
      textContent,
      htmlContent,
    },
  })

  // Log activity
  await prisma.activity.create({
    data: {
      organizationId: competitor.organizationId,
      type: 'EMAIL_RECEIVED',
      title: `Nouvel email de ${competitor.name}`,
      description: subject,
      entityId: competitor.id,
      competitorName: competitor.name,
    },
  })

  return NextResponse.json({ received: true, matched: true })
}
