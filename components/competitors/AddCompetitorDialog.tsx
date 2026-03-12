'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createCompetitor } from '@/actions/competitors'

const schema = z.object({
  name: z.string().min(1, 'Champ requis').max(100),
  website: z.string().url("URL invalide (ex: https://concurrent.fr)"),
  description: z.string().max(500).optional(),
  brandName: z.string().max(100).optional(),
  trackAds: z.boolean().default(true),
  trackEmails: z.boolean().default(false),
  trackSms: z.boolean().default(false),
  trackSeo: z.boolean().default(true),
  trackLlm: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

interface AddCompetitorDialogProps {
  onSuccess?: () => void
}

export function AddCompetitorDialog({ onSuccess }: AddCompetitorDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      trackAds: true,
      trackSeo: true,
      trackEmails: false,
      trackSms: false,
      trackLlm: false,
    },
  })

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const result = await createCompetitor(data)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${data.name} ajouté avec succès`)
        form.reset()
        setOpen(false)
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Ajouter un concurrent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau concurrent</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                placeholder="Ex: Hubspot"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brandName">Nom de marque (LLM)</Label>
              <Input
                id="brandName"
                placeholder="Ex: HubSpot CRM"
                {...form.register('brandName')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">Site web *</Label>
            <Input
              id="website"
              placeholder="https://concurrent.fr"
              {...form.register('website')}
            />
            {form.formState.errors.website && (
              <p className="text-xs text-destructive">{form.formState.errors.website.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez ce concurrent..."
              rows={2}
              {...form.register('description')}
            />
          </div>

          {/* Module toggles */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Modules à activer
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'trackAds' as const, label: 'Ads', desc: 'Scraping publicitaire' },
                { key: 'trackSeo' as const, label: 'SEO', desc: 'Balises & H1' },
                { key: 'trackEmails' as const, label: 'Emails', desc: 'Inbound tracking' },
                { key: 'trackSms' as const, label: 'SMS', desc: 'Via Twilio' },
                { key: 'trackLlm' as const, label: 'LLM', desc: 'Visibilité IA' },
              ].map((mod) => {
                const checked = form.watch(mod.key)
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => form.setValue(mod.key, !checked)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                      checked
                        ? 'border-primary/40 bg-primary/10 text-foreground'
                        : 'border-border bg-muted/20 text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`h-3 w-3 rounded-sm border-2 flex items-center justify-center ${
                        checked ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                      }`}
                    >
                      {checked && <div className="h-1.5 w-1.5 rounded-sm bg-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{mod.label}</p>
                      <p className="text-xs opacity-60">{mod.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Création...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
