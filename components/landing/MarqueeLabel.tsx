'use client'

import { useEffect, useRef } from 'react'

interface MarqueeLabelProps {
  words: string[]
  direction?: 'ltr' | 'rtl'
  speed?: number
}

export function MarqueeLabel({ words, direction = 'ltr', speed = 0.1 }: MarqueeLabelProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rafId: number

    const onScroll = () => {
      if (!trackRef.current) return
      const scrollY = window.scrollY
      const offset = scrollY * speed
      const x = direction === 'ltr' ? -offset : offset
      trackRef.current.style.transform = `translateX(${x}px)`
    }

    const tick = () => {
      onScroll()
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [direction, speed])

  // Duplicate words to ensure full coverage across all screen widths
  const repeated = [...words, ...words, ...words, ...words]

  return (
    <div
      className="marquee-track-wrap overflow-hidden pointer-events-none select-none py-10"
      aria-hidden="true"
    >
      <div ref={trackRef} className="marquee-track flex whitespace-nowrap will-change-transform">
        {repeated.map((word, i) => (
          <span
            key={i}
            className="text-[clamp(140px,18vw,240px)] font-bold tracking-[-0.04em] uppercase leading-none pr-[0.5em]"
            style={{
              fontFamily: 'var(--font-inter)',
              color: i % 2 === 0 ? 'var(--text)' : 'var(--accent)',
              opacity: i % 2 === 0 ? 0.06 : 0.12,
            }}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  )
}
