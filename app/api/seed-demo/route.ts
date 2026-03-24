import { NextResponse } from 'next/server'
import { seedDemoAds } from '@/actions/seedDemoAds'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  const result = await seedDemoAds()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}
