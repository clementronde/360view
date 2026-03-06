# Project Context: [Nom de ton SaaS]

## Vision
SaaS de Competitive Intelligence "tout-en-un" pour le marché français. 
Cible : Growth Marketers.
Objectif : Centraliser la veille Ads, Emails, SMS, SEO et visibilité LLM des concurrents.

## Tech Stack (Strict)
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Lucide React.
- **UI Components:** Shadcn/UI (style moderne, propre, orienté data).
- **Backend:** Next.js Server Actions / Route Handlers.
- **Database:** PostgreSQL via Supabase / Prisma ORM.
- **Auth:** Clerk.
- **Storage:** Supabase Storage (S3) pour les images des ads et screenshots.
- **Worker/Scraping:** Playwright (pour le statique) + Inbound API (pour les emails).

## Modules Spécifiques & Logique
1. **Ads Statiques:** Scraping via Playwright/Puppeteer. Stockage local de l'image pour éviter les liens morts.
2. **Email Tracking:** Chaque "Concurrent" suivi a une adresse email unique (ex: concu-1@mon-saas.com). Utilisation d'un webhook pour transformer le mail reçu en entrée DB.
3. **SMS Tracking:** Intégration via Twilio Webhooks.
4. **LLM Visibility:** Script hebdomadaire via API (Perplexity/OpenAI) pour tester le "Share of Model" de la marque.
5. **SEO:** Check quotidien des balises Meta et H1.

## Code Style & Rules
- **Langue:** Code en Anglais, Interface utilisateur en Français.
- **Localisation:** Format des dates (DD/MM/YYYY) et fuseau horaire (Europe/Paris).
- **Architecture:** Dossiers `/components` pour l'UI, `/lib` pour les fonctions utilitaires, `/hooks` pour la logique React.
- **Performance:** Utilisation de `Next/Image` pour toutes les captures d'écran concurrentes.
- **Résilience:** Toujours prévoir un système de retry pour les fonctions de scraping.