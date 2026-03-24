'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'

/* Animated counter */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / 40
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 30)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{val}{suffix}</span>
}

const testimonials = [
  {
    quote: "Avant 360View, je passais 2h par semaine à surveiller les pubs manuellement. Maintenant c'est automatique. J'ai récupéré ce temps pour autre chose.",
    name: 'Sarah M.',
    role: 'Head of Marketing',
    company: 'Scale-up SaaS, Paris',
    avatar: 'SM',
    color: '#8b5cf6',
  },
  {
    quote: "Le score LLM m'a ouvert les yeux. Je pensais qu'on était bien placés sur ChatGPT — en fait nos concurrents étaient cités 3× plus souvent. On a revu toute notre stratégie contenu.",
    name: 'Thomas L.',
    role: 'Fondateur',
    company: 'Agence e-commerce, Lyon',
    avatar: 'TL',
    color: '#6366f1',
  },
  {
    quote: "Le diff SEO nocturne est dingue. J'ai vu qu'un concurrent avait refait sa homepage un lundi matin — j'ai pu analyser leurs changements avant qu'ils rankent.",
    name: 'Marie B.',
    role: 'CMO',
    company: 'FinTech, Bordeaux',
    avatar: 'MB',
    color: '#ec4899',
  },
]

const stats = [
  { target: 5, suffix: '', label: 'Sources de données', sub: 'Meta · Google · TikTok · Email · SMS' },
  { target: 24, suffix: 'h', label: 'Cycle de mise à jour', sub: 'Scraping automatique quotidien' },
  { target: 2, suffix: '', label: 'Providers LLM', sub: 'GPT-4o + Perplexity' },
  { target: 100, suffix: '%', label: 'Données isolées', sub: 'Multi-tenant par organisation' },
]

export function SocialProof() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="py-24 px-6" ref={ref}>
      <div className="mx-auto max-w-6xl">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-2xl border border-border/50 bg-card/30 px-5 py-6 text-center"
            >
              <div className="text-4xl font-bold gradient-text tabular-nums mb-1">
                <Counter target={s.target} suffix={s.suffix} />
              </div>
              <div className="text-sm font-medium mb-1">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Ce que disent nos utilisateurs
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.35 + i * 0.1, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-2xl border border-border/50 bg-card/40 p-6 flex flex-col"
            >
              {/* Quote mark */}
              <div className="text-4xl font-serif leading-none mb-3" style={{ color: t.color + '50' }}>"</div>
              <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                {t.quote}
              </blockquote>
              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: t.color + '33', border: `1px solid ${t.color}44`, color: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role} · {t.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
