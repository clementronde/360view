import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const metadata = {
  title: 'API Reference | SpyMark',
  description: "Documentation de l'API REST SpyMark.",
}

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/competitors',
    description: 'Liste tous vos concurrents surveillés',
    color: '#059669',
    bg: '#D1FAE5',
  },
  {
    method: 'POST',
    path: '/api/v1/competitors',
    description: 'Ajoute un nouveau concurrent à surveiller',
    color: '#2563EB',
    bg: '#DBEAFE',
  },
  {
    method: 'GET',
    path: '/api/v1/competitors/:id/ads',
    description: 'Récupère les publicités d&apos;un concurrent',
    color: '#059669',
    bg: '#D1FAE5',
  },
  {
    method: 'GET',
    path: '/api/v1/competitors/:id/seo',
    description: 'Récupère les snapshots SEO d&apos;un concurrent',
    color: '#059669',
    bg: '#D1FAE5',
  },
  {
    method: 'GET',
    path: '/api/v1/competitors/:id/llm',
    description: 'Récupère les scores de visibilité LLM',
    color: '#059669',
    bg: '#D1FAE5',
  },
  {
    method: 'DELETE',
    path: '/api/v1/competitors/:id',
    description: 'Supprime un concurrent de la surveillance',
    color: '#DC2626',
    bg: '#FEE2E2',
  },
]

export default function ApiPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#FAFAF8', minHeight: '100vh', paddingTop: 80 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: 16 }}>
            Documentation
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 36, fontWeight: 700, color: '#111110', lineHeight: 1.2 }}>
              API Reference
            </h1>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#EEF2FF', color: '#4F6EF7' }}>
              Bêta
            </span>
          </div>
          <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 48, maxWidth: 520 }}>
            L&apos;API SpyMark vous permet d&apos;intégrer les données de veille concurrentielle dans vos propres outils et workflows.
          </p>

          {/* Auth */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111110', marginBottom: 16 }}>Authentification</h2>
            <p style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
              Toutes les requêtes doivent inclure votre clé API dans le header <code style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, background: '#F3F4F6', padding: '2px 6px', borderRadius: 4 }}>Authorization</code> :
            </p>
            <div style={{ background: '#111110', borderRadius: 10, padding: '16px 20px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#A5F3FC' }}>
              Authorization: Bearer sk_live_...
            </div>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 12 }}>
              Générez votre clé API depuis <a href="/dashboard/settings" style={{ color: '#4F6EF7' }}>Paramètres → API</a>.
            </p>
          </section>

          {/* Base URL */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111110', marginBottom: 16 }}>URL de base</h2>
            <div style={{ background: '#111110', borderRadius: 10, padding: '16px 20px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, color: '#86EFAC' }}>
              https://spymark.io/api/v1
            </div>
          </section>

          {/* Endpoints */}
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111110', marginBottom: 16 }}>Endpoints</h2>
            <div className="flex flex-col gap-3">
              {endpoints.map((ep, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: ep.bg, color: ep.color, flexShrink: 0, fontFamily: 'var(--font-jetbrains-mono)', minWidth: 52, textAlign: 'center' }}>
                    {ep.method}
                  </span>
                  <code style={{ fontSize: 13, fontFamily: 'var(--font-jetbrains-mono)', color: '#111110', flex: 1 }}>
                    {ep.path}
                  </code>
                  <span style={{ fontSize: 13, color: '#6B7280' }} dangerouslySetInnerHTML={{ __html: ep.description }} />
                </div>
              ))}
            </div>
          </section>

          <div style={{ marginTop: 48, padding: '20px 24px', background: '#FEF3C7', borderRadius: 10, border: '1px solid #FDE68A' }}>
            <p style={{ fontSize: 14, color: '#92400E', fontWeight: 500 }}>
              L&apos;API est en accès bêta. Contactez <a href="mailto:api@spymark.io" style={{ color: '#92400E', textDecoration: 'underline' }}>api@spymark.io</a> pour obtenir un accès anticipé.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
