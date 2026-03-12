import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: '360View — Veille Concurrentielle',
    template: '%s | 360View',
  },
  description:
    'Plateforme de veille concurrentielle tout-en-un : ads, emails, SMS, SEO et visibilité LLM.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="fr" className="dark">
        <body className={inter.className}>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(222 47% 8%)',
                border: '1px solid hsl(215 28% 15%)',
                color: 'hsl(213 31% 91%)',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
