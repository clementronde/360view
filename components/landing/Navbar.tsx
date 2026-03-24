'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Logo({ size = 26 }: { size?: number }) {
  const r = Math.round(size * 0.54)
  return (
    <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight" style={{ color: 'var(--text)', fontSize: 16 }}>
      <div className="flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, background: 'var(--accent)', borderRadius: 6 }} aria-hidden="true">
        <svg width={r} height={r} viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="3" fill="white" />
          <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
      SpyMark
    </Link>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="lp-nav sticky top-0 z-50 border-b backdrop-blur-md" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto max-w-[1100px] px-12 h-[58px] flex items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-7">
          {[
            { href: '#fonctionnalites', label: 'Fonctionnalités' },
            { href: '#tarifs', label: 'Tarifs' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm font-medium transition-colors duration-150 hover:text-foreground" style={{ color: 'var(--text-muted)' }}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/sign-in" className="text-sm font-medium px-4 py-2" style={{ color: 'var(--text-muted)' }}>
            Connexion
          </Link>
          <Link href="/sign-up" className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-all duration-150" style={{ background: 'var(--accent)' }}>
            Essai gratuit
          </Link>
        </div>

        <button
          className="md:hidden"
          style={{ color: 'var(--text-muted)' }}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden border-t px-6 py-4 flex flex-col gap-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <Link href="#fonctionnalites" className="text-sm" style={{ color: 'var(--text-muted)' }} onClick={() => setOpen(false)}>Fonctionnalités</Link>
          <Link href="#tarifs" className="text-sm" style={{ color: 'var(--text-muted)' }} onClick={() => setOpen(false)}>Tarifs</Link>
          <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <Link href="/sign-in" className="text-sm text-center py-2 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Connexion</Link>
            <Link href="/sign-up" className="text-sm text-center py-2 rounded-lg text-white font-medium" style={{ background: 'var(--accent)' }}>Essai gratuit</Link>
          </div>
        </div>
      )}
    </header>
  )
}
