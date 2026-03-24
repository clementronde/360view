import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Storage buckets
export const STORAGE_BUCKETS = {
  ADS: 'ads-screenshots',
  LOGOS: 'competitor-logos',
} as const

// ─── Lazy singleton — crashes only when actually used, not at import time ─────

let _admin: SupabaseClient | null = null

function getAdminClient(): SupabaseClient {
  if (_admin) return _admin

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      '[Supabase] Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add them in Railway → service → Variables.'
    )
  }

  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _admin
}

// Public client (for client-side use — Next.js app)
export const supabase = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null as unknown as SupabaseClient
  return createClient(url, anon)
})()

// Server-side admin client proxy
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getAdminClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// ─── Upload a screenshot to Supabase Storage ─────────────────────────────────

export async function uploadScreenshot(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; key: string } | null> {
  const client = getAdminClient()
  const key = `${Date.now()}-${filename}`
  const contentType =
    filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' : 'image/png'

  const { data, error } = await client.storage
    .from(STORAGE_BUCKETS.ADS)
    .upload(key, buffer, { contentType, upsert: false })

  if (error) {
    console.error('[Supabase Storage] Upload error:', JSON.stringify(error))
    return null
  }

  const { data: urlData } = client.storage
    .from(STORAGE_BUCKETS.ADS)
    .getPublicUrl(data.path)

  return { url: urlData.publicUrl, key: data.path }
}

// Alias used by adsCron
export async function uploadAdImage(
  buffer: Buffer,
  filename: string
): Promise<string | null> {
  const result = await uploadScreenshot(buffer, filename)
  return result?.url ?? null
}

// ─── Delete a screenshot from Supabase Storage ───────────────────────────────

export async function deleteScreenshot(key: string): Promise<boolean> {
  const client = getAdminClient()
  const { error } = await client.storage.from(STORAGE_BUCKETS.ADS).remove([key])
  if (error) {
    console.error('[Supabase Storage] Delete error:', error)
    return false
  }
  return true
}
