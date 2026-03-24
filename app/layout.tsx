import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SpyMark — Veille Concurrentielle',
    template: '%s | SpyMark',
  },
  description:
    'Plateforme de veille concurrentielle tout-en-un : ads, emails, SMS, SEO et visibilité LLM.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <head>
          {/* Synchronous theme init — prevents flash of wrong theme in dashboard */}
          <script dangerouslySetInnerHTML={{ __html: `
            try {
              if (window.location.pathname.startsWith('/dashboard')) {
                var t = localStorage.getItem('spymark-theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              }
            } catch(e) {}
          `}} />
        </head>
        <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
