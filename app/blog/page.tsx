import Link from 'next/link'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const metadata = {
  title: 'Blog | SpyMark',
  description: 'Conseils, guides et actualités sur la veille concurrentielle par SpyMark.',
}

const posts = [
  {
    slug: 'veille-concurrentielle-meta-ads',
    category: 'Guide',
    title: 'Comment surveiller les publicités Meta de vos concurrents en 2026',
    excerpt: 'La Meta Ads Library est une mine d\'or pour comprendre la stratégie publicitaire de vos concurrents. Voici comment l\'exploiter systématiquement.',
    date: 'Mars 2026',
    readTime: '6 min',
  },
  {
    slug: 'llm-visibility-seo-2026',
    category: 'Tendances',
    title: 'Visibilité LLM : le nouveau SEO que vos concurrents ne surveillent pas encore',
    excerpt: 'ChatGPT, Perplexity, Gemini — les moteurs de recherche IA influencent de plus en plus les décisions d\'achat. Voici pourquoi il faut surveiller votre présence dès maintenant.',
    date: 'Mars 2026',
    readTime: '8 min',
  },
  {
    slug: 'seo-competitor-monitoring',
    category: 'Guide',
    title: '5 signaux SEO à surveiller chez vos concurrents chaque semaine',
    excerpt: 'Title, meta description, structure H1, schema.org... ces changements trahissent souvent une refonte stratégique avant qu\'elle ne soit visible. Comment les détecter automatiquement.',
    date: 'Février 2026',
    readTime: '5 min',
  },
]

const categoryColors: Record<string, { color: string; bg: string }> = {
  Guide: { color: '#059669', bg: '#D1FAE5' },
  Tendances: { color: '#7C3AED', bg: '#EDE9FE' },
  Produit: { color: '#2563EB', bg: '#DBEAFE' },
}

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#FAFAF8', minHeight: '100vh', paddingTop: 80 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: 16 }}>
            Ressources
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#111110', marginBottom: 8, lineHeight: 1.2 }}>
            Blog
          </h1>
          <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 56, maxWidth: 500 }}>
            Guides pratiques, analyses et tendances sur la veille concurrentielle et le marketing digital.
          </p>

          <div className="flex flex-col gap-6">
            {posts.map((post) => {
              const cat = categoryColors[post.category] ?? { color: '#374151', bg: '#F3F4F6' }
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  style={{
                    display: 'block',
                    padding: '28px 32px',
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    textDecoration: 'none',
                  }}
                  className="hover:border-[#4F6EF7] hover:shadow-sm transition-all group"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: cat.bg, color: cat.color }}>
                      {post.category}
                    </span>
                    <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-jetbrains-mono)' }}>
                      {post.date} · {post.readTime} de lecture
                    </span>
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 8, lineHeight: 1.4 }} className="group-hover:text-[#4F6EF7] transition-colors">
                    {post.title}
                  </h2>
                  <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
                    {post.excerpt}
                  </p>
                </Link>
              )
            })}
          </div>

          <div style={{ marginTop: 48, padding: '24px 32px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#374151', marginBottom: 4 }}>
              Nouveaux articles chaque semaine.
            </p>
            <p style={{ fontSize: 14, color: '#6B7280' }}>
              Suivez-nous pour ne rien manquer — bientôt disponible en newsletter.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
