import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{ background: '#111110', color: '#FAFAF8', padding: '56px 48px 40px' }}>
      <div className="mx-auto max-w-[1100px]">
        <div className="grid gap-12 pb-10 mb-6" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 font-bold mb-3" style={{ fontSize: 16 }}>
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 26, height: 26, background: '#4F6EF7', borderRadius: 6 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="3" fill="white" />
                  <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              SpyMark
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(250,250,248,0.4)', marginTop: 12 }}>
              Intelligence concurrentielle automatisée.<br />Made with care in France.
            </p>
          </div>

          {[
            { title: 'Produit', links: [{ label: 'Fonctionnalités', href: '#fonctionnalites' }, { label: 'Tarifs', href: '#tarifs' }, { label: 'Changelog', href: '/changelog' }] },
            { title: 'Ressources', links: [{ label: 'Documentation', href: '/docs' }, { label: 'API', href: '/docs/api' }, { label: 'Blog', href: '/blog' }] },
            { title: 'Légal', links: [{ label: 'Confidentialité', href: '/legal/confidentialite' }, { label: 'CGU', href: '/legal/cgu' }, { label: 'Mentions légales', href: '/legal/mentions-legales' }] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(250,250,248,0.3)', marginBottom: 16 }}>{col.title}</div>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link href={l.href} style={{ fontSize: 13, color: 'rgba(250,250,248,0.5)' }} className="hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'rgba(250,250,248,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>© 2026 SpyMark</span>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'rgba(250,250,248,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fait avec soin en France</span>
        </div>
      </div>
    </footer>
  )
}
