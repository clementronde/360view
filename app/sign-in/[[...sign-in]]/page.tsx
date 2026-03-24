import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Connexion — 360View' }

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">3V</span>
            </div>
            <span className="font-semibold text-foreground">
              360<span className="gradient-text">View</span>
            </span>
          </Link>
          <p className="text-muted-foreground text-sm">Veille concurrentielle intelligente</p>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#7c3aed',
              colorBackground: 'hsl(222 47% 8%)',
              colorText: 'hsl(213 31% 91%)',
              colorInputBackground: 'hsl(215 28% 15%)',
              colorInputText: 'hsl(213 31% 91%)',
              borderRadius: '0.625rem',
            },
          }}
        />
      </div>
    </main>
  )
}
