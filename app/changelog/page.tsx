import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const metadata = {
  title: 'Changelog | SpyMark',
  description: 'Historique des mises à jour et nouvelles fonctionnalités de SpyMark.',
}

const releases = [
  {
    version: '0.1.0',
    date: 'Mars 2026',
    tag: 'Lancement',
    tagColor: '#4F6EF7',
    items: [
      { type: 'new', text: 'Surveillance automatique des publicités Meta Ads Library' },
      { type: 'new', text: 'Détection des changements SEO (title, meta, H1, canonical, schema)' },
      { type: 'new', text: 'Visibilité LLM — suivi de la présence de vos concurrents dans ChatGPT et Perplexity' },
      { type: 'new', text: 'Alertes email en temps réel sur nouvelles pubs et changements SEO' },
      { type: 'new', text: 'Digest hebdomadaire automatique tous les lundis à 8h' },
      { type: 'new', text: 'Dashboard analytics avec KPIs (nouvelles pubs, emails reçus, scores LLM)' },
      { type: 'new', text: 'Tracking email entrant par adresse dédiée par concurrent' },
      { type: 'new', text: "Plan Starter, Pro et Enterprise avec limites d'usage par plan" },
    ],
  },
]

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Nouveau', color: '#059669', bg: '#D1FAE5' },
  improved: { label: 'Amélioré', color: '#2563EB', bg: '#DBEAFE' },
  fixed: { label: 'Corrigé', color: '#D97706', bg: '#FEF3C7' },
  removed: { label: 'Supprimé', color: '#DC2626', bg: '#FEE2E2' },
}

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#FAFAF8', minHeight: '100vh', paddingTop: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: 16 }}>
            Produit
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#111110', marginBottom: 8, lineHeight: 1.2 }}>
            Changelog
          </h1>
          <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 56 }}>
            Toutes les mises à jour de SpyMark, dans l&apos;ordre chronologique.
          </p>

          <div className="flex flex-col gap-12">
            {releases.map((release) => (
              <div key={release.version} style={{ display: 'flex', gap: 32 }}>
                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: release.tagColor, marginTop: 6 }} />
                  <div style={{ width: 1, flex: 1, background: '#E5E7EB', marginTop: 8 }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, fontWeight: 700, color: '#111110' }}>
                      v{release.version}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: release.tagColor + '20', color: release.tagColor }}>
                      {release.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16, fontFamily: 'var(--font-jetbrains-mono)' }}>
                    {release.date}
                  </p>

                  <ul className="flex flex-col gap-3">
                    {release.items.map((item, i) => {
                      const cfg = typeConfig[item.type]
                      return (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: cfg.bg, color: cfg.color, flexShrink: 0, marginTop: 2 }}>
                            {cfg.label}
                          </span>
                          <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{item.text}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
