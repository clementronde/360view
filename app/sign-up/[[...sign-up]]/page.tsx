import { SignUp } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Inscription' }

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-text">360View</h1>
          <p className="text-muted-foreground mt-1 text-sm">Créez votre espace de veille</p>
        </div>
        <SignUp
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
