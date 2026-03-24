import { auth } from '@clerk/nextjs/server'
import { Settings, Key, Mail, MessageSquare, Brain, Webhook, Bell } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Paramètres' }

const integrations = [
  { name: 'Clerk', description: 'Authentification et gestion des utilisateurs', status: 'active', icon: Key },
  { name: 'Supabase', description: 'Base de données PostgreSQL et stockage fichiers', status: 'active', icon: Settings },
  { name: 'Email Inbound', description: 'Webhook pour capturer les emails entrants', status: 'config', icon: Mail, endpoint: 'POST /api/webhooks/email' },
  { name: 'Twilio SMS', description: 'Webhook pour capturer les campagnes SMS', status: 'config', icon: MessageSquare, endpoint: 'POST /api/webhooks/sms' },
  { name: 'LLM Visibility', description: 'OpenAI + Perplexity — suivi visibilité IA', status: 'config', icon: Brain, endpoint: 'POST /api/llm' },
  { name: 'Cron Ads', description: 'Scraping publicités — toutes les 5h', status: 'config', icon: Webhook, endpoint: 'POST /api/scraping/ads' },
  { name: 'Resend', description: 'Envoi des alertes et du digest hebdomadaire', status: 'config', icon: Bell, endpoint: 'RESEND_API_KEY requis' },
]

const envVars = [
  { key: 'DATABASE_URL', desc: 'Supabase PostgreSQL (pooler)', required: true },
  { key: 'DIRECT_URL', desc: 'Supabase PostgreSQL (direct)', required: true },
  { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', desc: 'Clerk frontend', required: true },
  { key: 'CLERK_SECRET_KEY', desc: 'Clerk backend', required: true },
  { key: 'CLERK_WEBHOOK_SECRET', desc: 'Validation webhooks Clerk', required: true },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', desc: 'URL du projet Supabase', required: true },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', desc: 'Clé anonyme Supabase', required: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Clé admin Supabase (storage)', required: true },
  { key: 'APP_SECRET', desc: 'Secret pour sécuriser les routes cron', required: true },
  { key: 'NEXT_PUBLIC_APP_URL', desc: "URL publique de l'app (pour les liens emails)", required: true },
  { key: 'RESEND_API_KEY', desc: 'Resend — alertes et digest email', required: false },
  { key: 'RESEND_FROM_EMAIL', desc: 'Expéditeur des emails (défaut: alerts@spymark.io)', required: false },
  { key: 'OPENAI_API_KEY', desc: 'OpenAI — LLM visibility', required: false },
  { key: 'PERPLEXITY_API_KEY', desc: 'Perplexity — LLM visibility', required: false },
  { key: 'TWILIO_ACCOUNT_SID', desc: 'Twilio — SMS tracking', required: false },
  { key: 'TWILIO_AUTH_TOKEN', desc: 'Twilio — SMS tracking', required: false },
  { key: 'TRACKING_EMAIL_DOMAIN', desc: 'Domaine pour les emails de tracking', required: false },
]

export default async function SettingsPage() {
  const { userId } = await auth()

  const org = userId
    ? await prisma.organization.findFirst({
        where: { clerkOrgId: userId },
        select: { alertEmail: true, weeklyDigest: true },
      })
    : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Paramètres" description="Configuration de votre espace SpyMark" />

      <div className="flex-1 overflow-auto p-4 lg:p-6 space-y-5">

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications & Alertes
            </CardTitle>
            <CardDescription>Email de destination et résumé hebdomadaire</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <NotificationSettings
              initial={{
                alertEmail: org?.alertEmail ?? null,
                weeklyDigest: org?.weeklyDigest ?? false,
              }}
            />
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Intégrations</CardTitle>
            <CardDescription>Services connectés à votre espace SpyMark</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {integrations.map((i) => (
              <div key={i.name} className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <i.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{i.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{i.description}</p>
                    {'endpoint' in i && (
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{i.endpoint}</p>
                    )}
                  </div>
                </div>
                <Badge variant={i.status === 'active' ? 'success' : 'warning'} className="shrink-0">
                  {i.status === 'active' ? 'Actif' : 'À configurer'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Env vars */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Variables d&apos;environnement</CardTitle>
            <CardDescription>
              Fichier <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code> requis en production
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0.5">
              {envVars.map((v) => (
                <div key={v.key} className="flex items-center justify-between gap-3 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-xs font-mono text-foreground shrink-0">{v.key}</code>
                    <span className="text-xs text-muted-foreground truncate hidden sm:block">{v.desc}</span>
                  </div>
                  <Badge variant={v.required ? 'destructive' : 'secondary'} className="shrink-0 text-[10px]">
                    {v.required ? 'Requis' : 'Optionnel'}
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
