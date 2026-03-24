'use client'

import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 5,   prefix: '',    suffix: '',    label: 'Canaux de veille' },
  { value: 15,  prefix: '< ',  suffix: 'min', label: 'Latence de détection' },
  { value: 100, prefix: '',    suffix: '%',   label: 'Données isolées par client' },
  { value: 4,   prefix: '',    suffix: 'x',   label: 'LLM interrogés en parallèle' },
]

function useCountUp(target: number, active: boolean, delay: number) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => {
      const duration = 1100
      const start = Date.now()
      const tick = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.round(eased * target))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [active, target, delay])
  return count
}

function StatItem({ stat, active, delay, index }: { stat: typeof STATS[0]; active: boolean; delay: number; index: number }) {
  const count = useCountUp(stat.value, active, delay)
  return (
    <div
      style={{
        padding: '24px 28px',
        borderLeft: index === 0 ? 'none' : '1px solid var(--border)',
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        transitionDelay: `${index * 80}ms`,
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
          marginBottom: 6,
        }}
      >
        {stat.prefix}{count}{stat.suffix}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stat.label}</div>
    </div>
  )
}

export function AnimatedStats() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setActive(true); obs.disconnect() }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="mx-auto max-w-[1100px]"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '0 48px 100px',
      }}
    >
      {STATS.map((s, i) => (
        <StatItem key={s.label} stat={s} active={active} delay={i * 80} index={i} />
      ))}
    </div>
  )
}
