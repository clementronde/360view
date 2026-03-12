'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { triggerAdsScraping } from '@/actions/scraping'

export function ScrapeButton() {
  const [loading, setLoading] = useState(false)

  async function handleScrape() {
    setLoading(true)
    const toastId = toast.loading('Scraping en cours… (peut prendre 30–60s)')

    try {
      const result = await triggerAdsScraping()

      if (!result.success) {
        toast.error(result.error ?? 'Erreur lors du scraping', { id: toastId })
        return
      }

      toast.success(
        result.total > 0
          ? `${result.total} nouvelle${result.total > 1 ? 's' : ''} pub${result.total > 1 ? 's' : ''} détectée${result.total > 1 ? 's' : ''} !`
          : 'Aucune nouvelle pub trouvée sur Meta Ad Library',
        { id: toastId }
      )
    } catch {
      toast.error('Erreur inattendue', { id: toastId })
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
