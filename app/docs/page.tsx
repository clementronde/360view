import Link from 'next/link'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { BookOpen, Zap, Key, Webhook, Code2, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Documentation | SpyMark',
  description: 'Documentation officielle de SpyMark — guides, API référence et intégrations.',
}

const sections = [
  {
    icon: Zap,
    title: 'Démarrage rapide',
    description: 'Configurez votre premier suivi concurrent en moins de 5 minutes.',
    href: '/docs/quickstart',
    tag: 'Recommandé',
  },
  {
    icon: BookOpen,
    title: 'Guides',
    description: 'Apprenez à utiliser toutes les fonctionnalités de SpyMark en détail.',
    href: '/docs/guides',
    tag: null,
  },
  {
    icon: Key,
    title: 'API Reference',
    description: 'Intégrez SpyMark dans vos outils via notre API REST.',
    href: '/docs/api',
    tag: 'Bêta',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description: 'Recevez des notifications en temps réel dans vos propres systèmes.',
    href: '/docs/webhooks',
    tag: null,
  },
  {
    icon: Code2,
    title: 'Intégrations',
    description: 'Connectez SpyMark avec Slack, Notion, Zapier et vos outils préférés.',
    href: '/docs/integrations',
    tag: 'Bientôt',
  },
]

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#FAFAF8', minHeight: '100vh', paddingTop: 80 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: 16 }}>
            Ressources
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#111110', marginBottom: 8, lineHeight: 1.2 }}>
            Documentation
          </h1>
          <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 56, maxWidth: 520 }}>
            Tout ce dont vous avez besoin pour tirer le maximum de SpyMark — guides, API et exemples d&apos;intégration.
          </p>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {sections.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.title}
                  href={s.href}
                  style={{
                    display: 'block',
                    padding: '24px',
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    textDecoration: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  className="hover:border-[#4F6EF7] hover:shadow-sm group"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color="#374151" />
                    </div>
                    {s.tag && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#EEF2FF', color: '#4F6EF7' }}>
                        {s.tag}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111110', marginBottom: 6 }}>{s.title}</h2>
                  <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 16 }}>{s.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#4F6EF7', fontWeight: 500 }}>
                    Voir la doc <ArrowRight size={13} />
                  </div>
                </Link>
              )
            })}
          </div>

          <div style={{ marginTop: 48, padding: '24px', background: '#111110', borderRadius: 12 }}>
            <p style={{ fontSize: 14, color: 'rgba(250,250,248,0.6)', marginBottom: 4 }}>
              Vous ne trouvez pas ce que vous cherchez ?
            </p>
            <p style={{ fontSize: 15, color: '#FAFAF8', fontWeight: 500 }}>
              Contactez notre équipe à{' '}
              <a href="mailto:support@spymark.io" style={{ color: '#818CF8' }}>support@spymark.io</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
