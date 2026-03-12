import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Twilio inbound SMS webhook.
 * Twilio sends a POST with form-encoded body when an SMS is received.
 *
 * Configure your Twilio number's "A MESSAGE COMES IN" webhook to point here.
 * Each competitor's SMS is captured when they text your Twilio number.
 */

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') ?? ''

  if (!contentType.includes('application/x-www-form-urlencoded')) {
    return NextResponse.json({ error: 'Expected form data' }, { status: 400 })
  }

  const formData = await req.formData()
  const from = formData.get('From') as string
  const to = formData.get('To') as string
  const body = formData.get('Body') as string
  const accountSid = formData.get('AccountSid') as string

  // Validate it's from our Twilio account
  if (accountSid !== process.env.TWILIO_ACCOUNT_SID) {
    return new Response('<Response></Response>', {
      status: 401,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  if (!from || !body) {
    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Match sender number to a competitor (simplified: find by phone prefix or store as unknown)
  // In production, you'd maintain a phone number → competitor mapping
  const competitors = await prisma.competitor.findMany({
    where: {
      trackSms: true,
      isActive: true,
    },
    select: { id: true, name: true, organizationId: true },
    take: 1, // In a real scenario, match by number prefix or dedicated number per competitor
  })

  const competitor = competitors[0]

  if (competitor) {
    await prisma.sMSMessage.create({
      data: {
        competitorId: competitor.id,
        fromNumber: from,
        content: body,
      },
    })

    await prisma.activity.create({
      data: {
        organizationId: competitor.organizationId,
        type: 'SMS_RECEIVED',
        title: `Nouveau SMS de ${competitor.name}`,
        description: body.slice(0, 100),
        entityId: competitor.id,
        competitorName: competitor.name,
      },
    })
  }

  // Respond with empty TwiML (no reply to the SMS sender)
  return new Response('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
