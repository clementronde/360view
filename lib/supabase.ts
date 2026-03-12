import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side client (limited permissions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client (full permissions for storage operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Storage buckets
export const STORAGE_BUCKETS = {
  ADS: 'ads-screenshots',
  LOGOS: 'competitor-logos',
} as const

// ─── Upload a screenshot to Supabase Storage ─────────────────────────────────

export async function uploadScreenshot(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; key: string } | null> {
  const key = `${Date.now()}-${filename}`

  const contentType = filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' : 'image/png'

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.ADS)
    .upload(key, buffer, { contentType, upsert: false })

  if (error) {
    console.error('[Supabase Storage] Upload error:', JSON.stringify(error))
    return null
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKETS.ADS)
    .getPublicUrl(data.path)

  return { url: urlData.publicUrl, key: data.path }
}

// ─── Delete a screenshot from Supabase Storage ───────────────────────────────

export async function deleteScreenshot(key: string): Promise<boolean> {
  const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKETS.ADS).remove([key])

  if (error) {
    console.error('[Supabase Storage] Delete error:', error)
    return false
  }

  return true
}
