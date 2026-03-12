import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date formatting (Europe/Paris) ──────────────────────────────────────────

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy', { locale: fr })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "dd/MM/yyyy 'à' HH:mm", { locale: fr })
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: fr })
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function getFaviconUrl(website: string): string {
  const domain = getDomain(website)
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

// ─── Slug generator ───────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

// ─── Tracking email generator ────────────────────────────────────────────────

export function generateTrackingEmail(competitorName: string, orgSlug: string): string {
  const domain = process.env.TRACKING_EMAIL_DOMAIN || 'tracking.360view.io'
  const slug = slugify(competitorName)
  return `${orgSlug}-${slug}@${domain}`
}

// ─── Platform labels ──────────────────────────────────────────────────────────

export const PLATFORM_LABELS: Record<string, string> = {
  META: 'Meta',
  GOOGLE: 'Google',
  LINKEDIN: 'LinkedIn',
  TWITTER: 'X (Twitter)',
  TIKTOK: 'TikTok',
  SNAPCHAT: 'Snapchat',
  PINTEREST: 'Pinterest',
  YOUTUBE: 'YouTube',
  OTHER: 'Autre',
}

export const PLATFORM_COLORS: Record<string, string> = {
  META: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  GOOGLE: 'bg-red-500/10 text-red-400 border-red-500/20',
  LINKEDIN: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  TWITTER: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  TIKTOK: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  SNAPCHAT: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  PINTEREST: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  YOUTUBE: 'bg-red-600/10 text-red-500 border-red-600/20',
  OTHER: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

// ─── LLM provider labels ─────────────────────────────────────────────────────

export const LLM_PROVIDER_LABELS: Record<string, string> = {
  OPENAI: 'ChatGPT',
  PERPLEXITY: 'Perplexity',
  ANTHROPIC: 'Claude',
  GEMINI: 'Gemini',
}

// ─── Score badge color ───────────────────────────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= 0.7) return 'text-emerald-400'
  if (score >= 0.4) return 'text-amber-400'
  return 'text-red-400'
}

// ─── Supabase image optimization ─────────────────────────────────────────────
// Uses Supabase's built-in image transformation API (served by Cloudflare CDN)
// instead of going through the Next.js /_next/image proxy.

export function getOptimizedImageUrl(url: string, _width = 400, _quality = 75): string {
  // Returns the URL as-is — images are served directly from Supabase CDN (no Next.js proxy)
  return url ?? ''
}

// ─── Truncate ─────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}
