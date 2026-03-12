import { auth } from '@clerk/nextjs/server'
import { Settings, Key, Mail, MessageSquare, Brain, Webhook } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Paramètres' }

const integrations = [
  {
    name: 'Clerk',
    description: 'Authentification et gestion des utilisateurs',
    status: 'active',
    icon: Key,
    docUrl: 'https://clerk.com/docs',
  },
  {
    name: 'Supabase',
    description: 'Base de données PostgreSQL et stockage fichiers',
    status: 'active',
    icon: Settings,
    docUrl: 'https://supabase.com/docs',
  },
  {
    name: 'Email Inbound',
    description: `Webhook pour capturer les emails (Postmark, Mailgun, SendGrid)`,
    status: 'config',
    icon: Mail,
    endpoint: '/api/webhooks/email',
  },
  {
    name: 'Twilio SMS',
    description: 'Webhook pour capturer les campagnes SMS',
    status: 'config',
    icon: MessageSquare,
    endpoint: '/api/webhooks/sms',
  },
  {
    name: 'LLM Visibility',
    description: 'OpenAI + Perplexity pour le suivi de visibilité IA',
    status: 'config',
    icon: Brain,
    endpoint: '/api/llm',
  },
  {
    name: 'Cron Jobs',
    description: 'Scraping quotidien Ads et SEO, hebdomadaire LLM',
    status: 'config',
    icon: Webhook,
    endpoint: '/api/scraping/ads, /api/scraping/seo',
  },
]

export default async function SettingsPage() {
  const { userId } = await auth()

  return (
    <div className="flex flex-col overflow-auto">
      <Header title="Paramètres" description="Configuration de votre espace 360View" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Intégrations</CardTitle>
            <CardDescription>Services connectés à votre espace 360View</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <integration.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
                    {integration.endpoint && (
                      <p className="text-xs font-mono text-muted-foreground/60 mt-1">
                        POST {integration.endpoint}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={integration.status === 'active' ? 'success' : 'warning'}>
                  {integration.status === 'active' ? 'Actif' : 'À configurer'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Environment variables reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Variables d&apos;environnement requises</CardTitle>
            <CardDescription>
              Copiez le fichier <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.example</code> vers{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code> et remplissez toutes les valeurs.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5">
              {[
                { key: 'DATABASE_URL', desc: 'Supabase PostgreSQL (pooler)', required: true },
                { key: 'DIRECT_URL', desc: 'Supabase PostgreSQL (direct)', required: true },
                { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', desc: 'Clerk frontend', required: true },
                { key: 'CLERK_SECRET_KEY', desc: 'Clerk backend', required: true },
                { key: 'CLERK_WEBHOOK_SECRET', desc: 'Validation webhooks Clerk', required: true },
                { key: 'NEXT_PUBLIC_SUPABASE_URL', desc: 'URL du projet Supabase', required: true },
                { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', desc: 'Clé anonyme Supabase', required: true },
                { key: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Clé admin Supabase (storage)', required: true },
                { key: 'APP_SECRET', desc: 'Secret pour sécuriser les routes cron', required: true },
                { key: 'TRACKING_EMAIL_DOMAIN', desc: 'Domaine pour les emails de tracking', required: false },
                { key: 'TWILIO_ACCOUNT_SID', desc: 'Twilio — SMS tracking', required: false },
                { key: 'TWILIO_AUTH_TOKEN', desc: 'Twilio — SMS tracking', required: false },
                { key: 'OPENAI_API_KEY', desc: 'OpenAI — LLM visibility', required: false },
                { key: 'PERPLEXITY_API_KEY', desc: 'Perplexity — LLM visibility', required: false },
              ].map((env) => (
                <div key={env.key} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-xs font-mono text-foreground">{env.key}</code>
                    <span className="text-xs text-muted-foreground truncate">{env.desc}</span>
                  </div>
                  <Badge variant={env.required ? 'destructive' : 'secondary'} className="shrink-0">
                    {env.required ? 'Requis' : 'Optionnel'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
