'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function CtaSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="py-24 px-6" ref={ref}>
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="relative rounded-3xl border border-primary/25 bg-gradient-to-b from-primary/8 to-transparent p-12 overflow-hidden text-center"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/15 rounded-full blur-[80px] -z-10" />

          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Commencez à surveiller vos{' '}
            <span className="gradient-text">concurrents aujourd'hui</span>
          </h2>
          <p className="text-muted-foreground mb-8 text-sm max-w-sm mx-auto">
            Gratuit pour toujours sur 3 concurrents. Aucune carte de crédit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="group flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-7 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
            >
              Créer mon compte gratuit
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
