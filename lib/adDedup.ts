/**
 * Ad deduplication utilities
 *
 * Two strategies:
 * 1. contentHash  — SHA-256 of the raw image buffer (exact duplicate detection)
 * 2. activeDays   — number of days since firstSeenAt (longevity proxy for engagement)
 */

import { createHash } from 'crypto'

/**
 * Returns the SHA-256 hex digest of an image buffer.
 * Use this before inserting a new ad — if the hash already exists in DB, skip the insert.
 */
export function hashImageBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

/**
 * Compute a normalized engagement score (0–100) from available signals.
 *
 * Priority order:
 * 1. TikTok Creative Center score (already 0-100)
 * 2. Meta impression range midpoint → mapped to 0-100 (log scale)
 * 3. Active days → mapped to 0-100 (longer = more likely performing)
 */
export function computeEngagementScore(opts: {
  platformScore?: number     // TikTok 0-100 raw score
  impressionsMin?: number    // Meta lower bound
  impressionsMax?: number    // Meta upper bound
  activeDays?: number        // days the ad has been running
}): number {
  const { platformScore, impressionsMin, impressionsMax, activeDays } = opts

  // TikTok provides a native score
  if (platformScore !== undefined) return Math.min(100, Math.max(0, platformScore))

  // Meta: use impression midpoint on a log scale (1k → 10, 1M → 80)
  if (impressionsMin !== undefined || impressionsMax !== undefined) {
    const mid = ((impressionsMin ?? 0) + (impressionsMax ?? impressionsMin ?? 0)) / 2
    if (mid > 0) {
      // log10(1000)=3 → 10pts, log10(1M)=6 → 80pts, log10(10M)=7 → 100pts
      const logVal = Math.log10(mid)
      return Math.min(100, Math.max(0, (logVal / 7) * 100))
    }
  }

  // Fallback: active days (cap at 90 days = 100)
  if (activeDays !== undefined) {
    return Math.min(100, Math.max(0, (activeDays / 90) * 100))
  }

  return 0
}

/**
 * Parse Meta Ad Library impression range strings like "1K–10K", "10K–50K", "<1K", ">1M"
 * Returns [min, max] as integers.
 */
export function parseMetaImpressionRange(range: string): [number, number] {
  const clean = range.replace(/\s/g, '').toUpperCase()

  const parseVal = (s: string) => {
    const n = parseFloat(s)
    if (s.includes('M')) return n * 1_000_000
    if (s.includes('K')) return n * 1_000
    return n
  }

  if (clean.startsWith('<')) return [0, parseVal(clean.slice(1))]
  if (clean.startsWith('>')) return [parseVal(clean.slice(1)), parseVal(clean.slice(1)) * 5]

  const parts = clean.split(/[–\-]/)
  if (parts.length === 2) return [parseVal(parts[0]), parseVal(parts[1])]

  const single = parseVal(clean)
  return [single, single]
}
