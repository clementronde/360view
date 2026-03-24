import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'
import { Footer } from '@/components/landing/Footer'
import { MarqueeLabel } from '@/components/landing/MarqueeLabel'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'SpyMark — Veille concurrentielle automatisée',
  description: 'Surveillez les publicités, emails, SMS, changements SEO et visibilité LLM de vos concurrents en temps réel.',
}

type DemoAdData = {
  id: string
  platform: string
  title: string | null
  advertiserName: string | null
  imageUrl: string | null
  ctaText: string | null
}

export default async function RootPage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  let demoAds: DemoAdData[] = []
  try {
    /* One representative ad per advertiser, up to 30 distinct brands */
    const advertisers = await prisma.ad.groupBy({
      by: ['advertiserName'],
      where: { imageUrl: { not: null } },
      orderBy: { advertiserName: 'asc' },
      take: 30,
    })
    const names = advertisers.map(a => a.advertiserName).filter(Boolean) as string[]
    const rows = await Promise.all(
      names.map(name =>
        prisma.ad.findFirst({
          where: { advertiserName: name, imageUrl: { not: null } },
          select: { id: true, platform: true, title: true, advertiserName: true, imageUrl: true, ctaText: true },
          orderBy: { firstSeenAt: 'desc' },
        })
      )
    )
    demoAds = rows.filter(Boolean) as DemoAdData[]
  } catch { /* DB not available */ }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main>

        <Hero demoAds={demoAds} />

        <MarqueeLabel words={['Publicités']} direction="ltr" speed={0.12} />

        <Features demoAds={demoAds} />

        <MarqueeLabel words={['SEO', 'LLM', 'Email', 'SMS']} direction="rtl" speed={0.09} />

        {/* ── Stats ── */}
        <section style={{ borderTop: '1px solid var(--border)' }}>
          <div className="mx-auto max-w-[1100px] px-12" style={{ paddingBottom: 100 }}>
            <div className="grid grid-cols-4">
              {[
                { value: '5',    label: 'Canaux surveillés' },
                { value: '24h',  label: 'Cycle de mise à jour' },
                { value: '2',    label: 'LLM providers' },
                { value: '100%', label: 'Données isolées' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    borderLeft: i > 0 ? '1px solid var(--border)' : undefined,
                    padding: '48px 40px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 36,
                      fontWeight: 700,
                      color: 'var(--text)',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <MarqueeLabel words={['Tarifs']} direction="ltr" speed={0.08} />

        <Pricing />

        <MarqueeLabel words={['Intelligence', 'Concurrentielle']} direction="rtl" speed={0.10} />

        {/* ── CTA finale ── */}
        <section style={{ borderTop: '3px solid var(--accent)' }}>
          <div
            className="mx-auto max-w-[1100px] px-12"
            style={{ paddingTop: 100, paddingBottom: 100, textAlign: 'center' }}
          >
            <div
              className="inline-flex items-center gap-2 mb-7"
              style={{
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--accent)', flexShrink: 0 }} />
              Inscription gratuite
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: '-0.04em',
                color: 'var(--text)',
                maxWidth: 560,
                margin: '0 auto 20px',
              }}
            >
              Prenez une longueur d&apos;avance<br />
              sur vos <span style={{ color: 'var(--accent)' }}>concurrents.</span>
            </h2>

            <p
              style={{
                fontSize: 16,
                lineHeight: 1.65,
                color: 'var(--text-muted)',
                maxWidth: 340,
                margin: '0 auto 40px',
              }}
            >
              30 secondes pour créer un compte. Aucune carte bancaire.
            </p>

            <div className="flex items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="text-[15px] font-semibold px-7 py-3.5 rounded-lg text-white transition-all duration-150"
                style={{ background: 'var(--accent)' }}
              >
                Commencer gratuitement
              </Link>
              <Link
                href="mailto:contact@spymark.io"
                className="text-[15px] font-medium px-7 py-3.5 rounded-lg border transition-colors duration-150"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                Contacter l&apos;équipe
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
