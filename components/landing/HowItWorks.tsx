'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const steps = [
  {
    n: '01',
    title: 'Ajoutez vos concurrents',
    desc: 'Nom, site web, nom de marque. 60 secondes pour le premier suivi.',
    detail: "Chaque concurrent reçoit une adresse email de tracking unique générée automatiquement.",
    color: '#8b5cf6',
  },
  {
    n: '02',
    title: 'Activez les modules',
    desc: 'Pubs, SEO, emails, SMS, LLM — choisissez ce que vous voulez surveiller.',
    detail: "Chaque module est indépendant. Désactivez ceux dont vous n'avez pas besoin pour garder le tableau de bord propre.",
    color: '#6366f1',
  },
  {
    n: '03',
    title: 'Le dashboard se met à jour',
    desc: "Chaque signal détecté s'affiche dans votre feed d'activité en temps réel.",
    detail: "Scraping quotidien des pubs. SEO vérifié chaque nuit. LLM testé chaque semaine.",
    color: '#22c55e',
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="comment-ca-marche" className="py-24 px-6">
      <div className="mx-auto max-w-5xl" ref={ref}>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-3">Comment ça marche</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Opérationnel en <span className="gradient-text">moins de 5 minutes</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Aucun SDK à installer. Aucun pixel à poser. Juste une URL.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] }}
              className="relative rounded-2xl border border-border/50 bg-card/40 p-6"
            >
              {/* Connector */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 -right-3 w-6 h-px bg-border z-10" />
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: step.color + '22', border: `1px solid ${step.color}33`, color: step.color }}
                >
                  {step.n}
                </div>
                <h3 className="font-semibold text-sm">{step.title}</h3>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.desc}</p>
              <p className="text-xs text-muted-foreground/60 leading-relaxed border-t border-border/40 pt-3">{step.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
