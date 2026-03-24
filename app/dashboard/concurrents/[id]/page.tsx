import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Search,
  Brain,
  Copy,
  Bell,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getFaviconUrl, getDomain, formatDateTime, PLATFORM_LABELS, PLATFORM_COLORS } from '@/lib/utils'
import { AlertToggles } from '@/components/competitors/AlertToggles'
import type { Metadata } from 'next'

async function getCompetitorWithData(id: string, orgId: string) {
  return prisma.competitor.findFirst({
    where: { id, organizationId: orgId },
    include: {
      ads: { orderBy: { firstSeenAt: 'desc' }, take: 20 },
      emails: { orderBy: { receivedAt: 'desc' }, take: 20 },
      smsMessages: { orderBy: { receivedAt: 'desc' }, take: 20 },
      seoSnapshots: { orderBy: { checkedAt: 'desc' }, take: 10 },
      llmScores: { orderBy: { checkedAt: 'desc' }, take: 20 },
    },
  })
}

async function getOrgForUser(userId: string) {
  return prisma.organization.findFirst({ where: { clerkOrgId: userId } })
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: 'Détail concurrent' }
}

export default async function CompetitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) notFound()

  const org = await getOrgForUser(userId)
  if (!org) notFound()

  const competitor = await getCompetitorWithData(id, org.id)
  if (!competitor) notFound()

  return (
    <div className="flex flex-col overflow-auto">
      <Header
        title={competitor.name}
        description={getDomain(competitor.website)}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/concurrents">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Competitor header card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border bg-muted shrink-0">
                <Image
                  src={competitor.logoUrl ?? getFaviconUrl(competitor.website)}
                  alt={competitor.name}
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold">{competitor.name}</h2>
                  <Badge variant={competitor.isActive ? 'success' : 'secondary'}>
                    {competitor.isActive ? 'Actif' : 'Pausé'}
                  </Badge>
                </div>
                <a
                  href={competitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {competitor.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {competitor.description && (
                  <p className="text-sm text-muted-foreground mt-1">{competitor.description}</p>
                )}
              </div>

              {competitor.trackingEmail && (
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground mb-1">Email de tracking</p>
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                    <span className="text-xs font-mono text-foreground">
                      {competitor.trackingEmail}
                    </span>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alert preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alertes email
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <AlertToggles
              competitorId={competitor.id}
              initial={{
                alertNewAds: competitor.alertNewAds,
                alertSeoChange: competitor.alertSeoChange,
                alertLlmChange: competitor.alertLlmChange,
              }}
            />
            <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
              Les alertes sont envoyées à l&apos;adresse de votre compte.
              Configurez une adresse différente dans les paramètres.
            </p>
          </CardContent>
        </Card>

        {/* Tabs for each module */}
        <Tabs defaultValue="ads">
          <TabsList>
            {competitor.trackAds && (
              <TabsTrigger value="ads" className="gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Ads ({competitor.ads.length})
              </TabsTrigger>
            )}
            {competitor.trackEmails && (
              <TabsTrigger value="emails" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Emails ({competitor.emails.length})
              </TabsTrigger>
            )}
            {competitor.trackSms && (
              <TabsTrigger value="sms" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                SMS ({competitor.smsMessages.length})
              </TabsTrigger>
            )}
            {competitor.trackSeo && (
              <TabsTrigger value="seo" className="gap-1.5">
                <Search className="h-3.5 w-3.5" />
                SEO ({competitor.seoSnapshots.length})
              </TabsTrigger>
            )}
            {competitor.trackLlm && (
              <TabsTrigger value="llm" className="gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                LLM ({competitor.llmScores.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* ADS TAB */}
          {competitor.trackAds && (
            <TabsContent value="ads">
              {competitor.ads.length === 0 ? (
                <EmptyState icon={ImageIcon} label="Aucune publicité détectée" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
                  {competitor.ads.map((ad) => (
                    <div key={ad.id} className="rounded-xl border border-border bg-card overflow-hidden">
                      {ad.imageUrl ? (
                        <div className="relative aspect-video bg-muted">
                          <Image src={ad.imageUrl} alt={ad.title ?? 'Ad'} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Badge className={PLATFORM_COLORS[ad.platform]}>
                            {PLATFORM_LABELS[ad.platform]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(ad.firstSeenAt)}
                          </span>
                        </div>
                        {ad.title && <p className="text-xs font-medium line-clamp-2">{ad.title}</p>}
                        {ad.description && (
                          <p className="text-xs text-muted-foreground line-clamp-3">{ad.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* EMAILS TAB */}
          {competitor.trackEmails && (
            <TabsContent value="emails">
              {competitor.emails.length === 0 ? (
                <EmptyState icon={Mail} label="Aucun email reçu" />
              ) : (
                <div className="mt-4 space-y-2">
                  {competitor.emails.map((email) => (
                    <div key={email.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-border/80 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                        <Mail className="h-4 w-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{email.subject}</p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDateTime(email.receivedAt)}
                          </span>
                        </div>
                        {email.fromName && (
                          <p className="text-xs text-muted-foreground">{email.fromName} &lt;{email.fromEmail}&gt;</p>
                        )}
                        {email.textContent && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{email.textContent}</p>
                        )}
                      </div>
                      {!email.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* SMS TAB */}
          {competitor.trackSms && (
            <TabsContent value="sms">
              {competitor.smsMessages.length === 0 ? (
                <EmptyState icon={MessageSquare} label="Aucun SMS reçu" />
              ) : (
                <div className="mt-4 space-y-2">
                  {competitor.smsMessages.map((sms) => (
                    <div key={sms.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-muted-foreground">{sms.fromNumber}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(sms.receivedAt)}</span>
                      </div>
                      <p className="text-sm">{sms.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* SEO TAB */}
          {competitor.trackSeo && (
            <TabsContent value="seo">
              {competitor.seoSnapshots.length === 0 ? (
                <EmptyState icon={Search} label="Aucun snapshot SEO" />
              ) : (
                <div className="mt-4 space-y-3">
                  {competitor.seoSnapshots.map((snap) => (
                    <div key={snap.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <a href={snap.url} target="_blank" rel="noopener noreferrer"
                           className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1">
                          {snap.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <div className="flex items-center gap-2">
                          {(snap.titleChanged || snap.metaChanged || snap.h1Changed) && (
                            <Badge variant="warning">Changement détecté</Badge>
                          )}
                          <Badge variant="outline">{snap.statusCode ?? '—'}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDateTime(snap.checkedAt)}</span>
                        </div>
                      </div>
                      {snap.title && (
                        <div>
                          <span className="text-xs text-muted-foreground">Title: </span>
                          <span className="text-xs">{snap.title}</span>
                        </div>
                      )}
                      {snap.metaDesc && (
                        <div>
                          <span className="text-xs text-muted-foreground">Meta desc: </span>
                          <span className="text-xs">{snap.metaDesc}</span>
                        </div>
                      )}
                      {snap.h1 && (
                        <div>
                          <span className="text-xs text-muted-foreground">H1: </span>
                          <span className="text-xs">{snap.h1}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* LLM TAB */}
          {competitor.trackLlm && (
            <TabsContent value="llm">
              {competitor.llmScores.length === 0 ? (
                <EmptyState icon={Brain} label="Aucune analyse LLM" />
              ) : (
                <div className="mt-4 space-y-3">
                  {competitor.llmScores.map((score) => (
                    <div key={score.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{score.provider}</Badge>
                          {score.mentioned ? (
                            <Badge variant="success">Mentionné</Badge>
                          ) : (
                            <Badge variant="secondary">Non mentionné</Badge>
                          )}
                          {score.sentiment && (
                            <Badge variant={score.sentiment === 'positive' ? 'success' : score.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                              {score.sentiment}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {score.score !== null && (
                            <span className="text-sm font-bold text-primary">
                              {Math.round(score.score * 100)}%
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{formatDateTime(score.checkedAt)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Prompt :</p>
                        <p className="text-xs bg-muted/40 rounded p-2">{score.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center mt-4 rounded-xl border border-dashed border-border">
      <Icon className="h-8 w-8 text-muted-foreground/30 mb-3" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
