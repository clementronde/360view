'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ScrapeButton() {
  const [loading, setLoading] = useState(false)

  async function handleScrape() {
    setLoading(true)
    const toastId = toast.loading('Scraping en cours… (peut prendre 30–60s)')

    try {
      const res = await fetch('/api/scraping/trigger', { method: 'POST' })
      const result = await res.json() as {
        success: boolean
        total: number
        error?: string
        mode?: 'competitors' | 'discovery'
      }

      if (!result.success) {
        toast.error(result.error ?? 'Erreur lors du scraping', { id: toastId })
        return
      }

      if (result.total > 0) {
        const suffix = result.mode === 'discovery'
          ? ` ajoutée${result.total > 1 ? 's' : ''} au fil Découvrir`
          : ` détectée${result.total > 1 ? 's' : ''}`
        toast.success(`${result.total} pub${result.total > 1 ? 's' : ''}${suffix} !`, { id: toastId })
      } else {
        toast.info(
          result.mode === 'discovery'
            ? 'Aucune pub trouvée — vérifie META_ACCESS_TOKEN dans Vercel'
            : 'Aucune nouvelle pub pour tes concurrents',
          { id: toastId }
        )
      }
    } catch {
      toast.error('Erreur réseau inattendue', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleScrape}
      disabled={loading}
      size="sm"
      variant="outline"
      className="gap-2"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Scraping…' : 'Lancer le scraping'}
    </Button>
  )
}
