'use client'

import { useState } from 'react'
import { X, Search, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { searchMetaPages, type MetaPageResult } from '@/actions/searchMetaPages'
import { scrapePageById } from '@/actions/scrapePageById'
import { Button } from '@/components/ui/button'

interface PagePickerProps {
  query: string
  onScraped: () => void
  onClose: () => void
}

export function PagePicker({ query, onScraped, onClose }: PagePickerProps) {
  const [pages, setPages] = useState<MetaPageResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [scrapingId, setScrapingId] = useState<string | null>(null)

  async function handleSearch() {
    setSearching(true)
    setSearched(false)
    try {
      const result = await searchMetaPages(query)
      setPages(result.pages)
      setSearched(true)
      if (result.error) toast.error(result.error)
    } catch {
      toast.error('Erreur lors de la recherche')
    } finally {
      setSearching(false)
    }
  }

  async function handleScrape(page: MetaPageResult) {
    setScrapingId(page.pageId)
    const toastId = toast.loading(`Scraping "${page.name}"…`)
    try {
      const result = await scrapePageById(page.name, page.pageId)
      if (result.error) {
        toast.error(result.error, { id: toastId })
      } else if (result.added === 0) {
        toast.info(`Aucune pub image trouvée pour "${page.name}"`, { id: toastId })
      } else {
        toast.success(
          `${result.added} pub${result.added > 1 ? 's' : ''} ajoutée${result.added > 1 ? 's' : ''} · ${page.name}`,
          { id: toastId }
        )
        onScraped()
        onClose()
      }
    } catch {
      toast.error('Erreur scraping', { id: toastId })
    } finally {
      setScrapingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-card border border-border/60 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/40">
          <div>
            <h2 className="text-sm font-semibold">Rechercher une page Meta</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choisissez la page dont vous voulez scraper les publicités
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/60 hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search row */}
        <div className="px-5 py-3 flex items-center gap-2 border-b border-border/40">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground">{query}</span>
          </div>
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={searching}
            className="gap-1.5 text-xs h-9"
          >
            {searching
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Search className="h-3.5 w-3.5" />
            }
            {searching ? 'Recherche…' : 'Rechercher'}
          </Button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {!searched && !searching && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Search className="h-4.5 w-4.5 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground">
                Cliquez sur &ldquo;Rechercher&rdquo; pour trouver les pages Facebook correspondantes
              </p>
            </div>
          )}

          {searching && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-3" />
              <p className="text-xs text-muted-foreground">Recherche sur Meta Ad Library…</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">~10-15 secondes</p>
            </div>
          )}

          {searched && pages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium">Aucune page trouvée</p>
              <p className="text-xs text-muted-foreground mt-1">
                Essayez un autre terme de recherche
              </p>
            </div>
          )}

          {searched && pages.length > 0 && (
            <ul className="divide-y divide-border/30">
              {pages.map((p) => (
                <li key={p.pageId} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                  {/* Page picture */}
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-muted/40 shrink-0 flex items-center justify-center">
                    {p.pictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.pictureUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    {p.subtitle && (
                      <p className="text-[10px] text-muted-foreground truncate">{p.subtitle}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50">ID: {p.pageId}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`https://www.facebook.com/ads/library/?view_all_page_id=${p.pageId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground transition-colors"
                      title="Voir sur Meta Ad Library"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => handleScrape(p)}
                      disabled={scrapingId !== null}
                    >
                      {scrapingId === p.pageId
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : 'Scraper'
                      }
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        {searched && pages.length > 0 && (
          <div className="px-5 py-3 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground text-center">
              {pages.length} page{pages.length > 1 ? 's' : ''} trouvée{pages.length > 1 ? 's' : ''} · Scraping ~2 min par page
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
