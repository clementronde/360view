# Direction Artistique — SpyMark
**Date :** 2026-03-19
**Statut :** Approuvé

---

## Contexte

SpyMark est un SaaS B2B de veille concurrentielle automatisée (publicités, emails, SMS, SEO, LLM). L'objectif de cette refonte est de sortir d'un rendu "fait par l'IA" pour adopter une vraie direction artistique premium, cohérente entre la Landing Page et l'application.

---

## Positionnement visuel

**"Premium & Confiance"** — sobre, crédible, outil sérieux pour professionnels du marketing.

**Landing Page :** Vitrine éditoriale, fond blanc cassé, grandes typos, sections aérées.
**Application :** Cockpit de l'analyste, même ADN mais plus dense, focalisé sur les données.
**Relation :** Deux mondes, une famille — mêmes couleurs, mêmes polices, atmosphères distinctes.

---

## Système de couleurs

### Light mode (défaut)

| Token CSS | Valeur hex | Usage |
|-----------|-----------|-------|
| `--bg` | `#FAFAF8` | Fond principal (blanc cassé chaud) |
| `--surface` | `#FFFFFF` | Cards, panels, sidebar |
| `--surface-muted` | `#F4F3F0` | Zones secondaires, inputs, table headers |
| `--border` | `#E8E6E1` | Séparateurs, outlines, barres neutres |
| `--text` | `#111110` | Corps, labels |
| `--text-muted` | `#6F6C66` | Secondaire, metadata, placeholders |
| `--accent` | `#4F6EF7` | Indigo — boutons, liens actifs, barres "nouveau" |
| `--accent-hover` | `#3D59D9` | État hover boutons accent |
| `--accent-subtle` | `#EEF1FE` | Fond pills actives, fond avatar plan |
| `--success` | `#1A7A52` | Positif, croissance LLM, statut actif |
| `--changed` | `#C2410C` | Alerte SEO, changement détecté (orange) |
| `--destructive` | `#D94B3A` | Erreurs, suppressions |

> Note de nommage : `--changed` (renommé depuis `--warning`) désigne spécifiquement les états "diff/changed" (SEO modifié, changement détecté). Distinct de `--destructive` qui désigne les erreurs ou suppressions.

### Dark mode (toggle)

Activé par la classe `.dark` sur `<html>`. Persisté en `localStorage` sous la clé `"spymark-theme"`. Fallback sur `prefers-color-scheme: dark` si aucune valeur stockée.

| Token CSS | Valeur hex dark |
|-----------|----------------|
| `--bg` | `#0D0F14` |
| `--surface` | `#13161D` |
| `--surface-muted` | `#1A1E27` |
| `--border` | `#242835` |
| `--text` | `#E8E6E1` |
| `--text-muted` | `#6F7280` |
| `--accent` | `#4F6EF7` *(identique — fonctionne sur les deux fonds)* |
| `--accent-hover` | `#6B84F9` |
| `--accent-subtle` | `#1A1F3A` |
| `--success` | `#22A06B` |
| `--changed` | `#EA580C` |
| `--destructive` | `#E05545` |

**Règles invariantes :**
- `#FAFAF8` jamais remplacé par blanc pur en light mode
- Le footer LP est toujours `#111110` (sombre), même en light mode

---

## Typographie

**Deux familles uniquement :**

| Famille | Google Fonts slug | Usage |
|---------|------------------|-------|
| `Inter` | `Inter:wght@400;500;600;700` | Tout le texte UI, corps, titres, boutons |
| `JetBrains Mono` | `JetBrains+Mono:wght@400;500` | Données chiffrées, labels uppercase, timestamps, %, platform tags |

**Remplace :** `Bricolage_Grotesque` et `DM_Sans` (supprimés de `layout.tsx`).

**Échelle :**

| Rôle | Spec complète |
|------|--------------|
| Display hero | Inter 700 / 52px / letter-spacing −0.03em / line-height 1.08 |
| Section title | Inter 700 / 40px / letter-spacing −0.03em / line-height 1.1 |
| Heading 2 | Inter 600 / 24px / letter-spacing −0.01em / line-height 1.3 |
| Body | Inter 400 / 16px / line-height 1.7 |
| Body small | Inter 400–500 / 14px / line-height 1.5 |
| Mono data | JetBrains Mono 400–500 / 11–13px / line-height 1.6 |
| Mono label | JetBrains Mono 500 / 10px / uppercase / letter-spacing 0.08em |

**Règles anti-"AI" :**
- Pas de gradient text (`background-clip: text`) sur les titres
- Pas de glassmorphism (`backdrop-filter` limité à la navbar)
- 1 mot ou groupe de mots en `--accent` par headline — jamais de dégradé
- JetBrains Mono systématique pour toute donnée chiffrée ou métadonnée

---

## Logo

**Composant `<Logo />`** réutilisé identiquement sur LP (navbar) et app (sidebar).

Structure :
```
<div class="logo">
  <div class="logo-mark">        <!-- 26px × 26px, border-radius 6px, background --accent -->
    <svg viewBox="0 0 14 14">
      <circle cx="7" cy="7" r="3" fill="white"/>
      <circle cx="7" cy="7" r="6" stroke="white" stroke-width="1.5" fill="none"/>
    </svg>
  </div>
  <span>SpyMark</span>           <!-- Inter 700, 16px, --text -->
</div>
```

En sidebar (taille réduite) : logo-mark → 22px, border-radius 5px, SVG 12px.

---

## Indicateurs — Barres de bord (remplace les pill badges)

**Principe :** La couleur sémantique est portée par une barre verticale `3px` sur le bord gauche de l'élément. Aucun fond coloré, aucun pill badge.

**Classes utilitaires à créer :**
- `.border-accent` → `border-left: 3px solid #4F6EF7`
- `.border-changed` → `border-left: 3px solid #C2410C`
- `.border-success` → `border-left: 3px solid #1A7A52`
- `.border-neutral` → `border-left: 3px solid #E8E6E1`

**Sémantique :**
| Couleur | Classe | Signification |
|---------|--------|---------------|
| Indigo `--accent` | `.border-accent` | Nouveau, récent (< 15min) |
| Orange `--changed` | `.border-changed` | Alerte SEO, changement détecté |
| Vert `--success` | `.border-success` | Positif, croissance |
| Gris `--border` | `.border-neutral` | Standard, lu, inactif |

**Application :**
- Lignes de tableau (`<tr>`) : `border-left: 3px solid <couleur>` selon alerte active
- Cards masonry : `border-left: 3px solid --accent` si `isNew`
- KPI cards : `border-left: 3px` coloré si état actif
- Listes d'alertes (hero, dashboard) : barre colorée à gauche de chaque ligne

**Texte de statut :** En JetBrains Mono 11px, coloré avec la même couleur sémantique. Pas de fond.

---

## Signature visuelle — Marquee labels

**Élément distinctif principal de la LP.** Texte géant entre chaque section, se déplace lentement lié au scroll.

### Spec technique

```
font-family: Inter
font-size: clamp(140px, 18vw, 240px)
font-weight: 700
letter-spacing: -0.04em
text-transform: uppercase
```

**Opacité :**
- Mot neutre : `color: var(--text)` + `opacity: 0.06`
- Mot coloré (alternés) : `color: var(--accent)` + `opacity: 0.12`

**Mouvement :**
```js
// rAF loop — PAS de CSS animation automatique
scrollY = window.scrollY
translateX = dir === 'ltr' ? -(scrollY * speed) : +(scrollY * speed)
track.style.transform = `translateX(${translateX}px)`
```

**4 marquees sur la LP :**

| Position | Texte | Direction | Speed |
|----------|-------|-----------|-------|
| Hero → Features | `PUBLICITÉS` | LTR | 0.12 |
| Features → Stats | `SEO · LLM · EMAIL · SMS` | RTL | 0.09 |
| Stats → Pricing | `TARIFS` | LTR | 0.08 |
| Pricing → Footer | `INTELLIGENCE · CONCURRENTIELLE` | RTL | 0.10 |

**Chaque marquee** : `padding: 40px 0`, overflow hidden, pointer-events none, z-index 0.

**Accessibilité `prefers-reduced-motion` :**
```css
@media (prefers-reduced-motion: reduce) {
  .marquee-track { transform: none !important; transition: none; }
}
```
Et en JS : vérifier `window.matchMedia('(prefers-reduced-motion: reduce)').matches` avant de lancer le rAF loop.

---

## Landing Page — Layout et contenu

### Structure (ordre de lecture)

1. **Navbar**
2. **Hero** (120px top / 100px bottom)
3. **Marquee 1** — PUBLICITÉS
4. **Features** — bento (100px padding)
5. **Marquee 2** — SEO · LLM · EMAIL · SMS
6. **Stats** (0 top / 100px bottom)
7. **Marquee 3** — TARIFS
8. **Pricing** (100px padding)
9. **Marquee 4** — INTELLIGENCE · CONCURRENTIELLE
10. **Footer** (56px top / 40px bottom)

Max-width contenu : `1100px`. Padding horizontal : `48px`.

---

### Navbar

- Position : `sticky`, `top: 0`, fond `rgba(250,250,248,0.94)` + `backdrop-filter: blur(10px)`
- Hauteur : `58px`
- Contenu : Logo gauche / Links centre / CTAs droite
- Links : `Fonctionnalités`, `Comment ça marche`, `Tarifs` — Inter 500 14px `--text-muted`
- CTAs : `btn-ghost` "Se connecter" + `btn-primary` "Essai gratuit"
- **Theme toggle** : icône soleil/lune, coin droit de la navbar. `localStorage.setItem('spymark-theme', 'dark'/'light')`.

---

### Hero

**Colonne gauche :**
- Eyebrow : JetBrains Mono 11px uppercase `--text-muted`, précédé d'une barre `3px` `--success`
  - Texte : `Surveillance continue — 5 canaux`
- Headline (Inter 700 / 52px) :
  ```
  Vos concurrents
  bougent. Soyez
  [le premier]   ← en --accent
  à le savoir.
  ```
- Body (Inter 400 / 16px / `--text-muted`) :
  > "SpyMark surveille automatiquement les publicités, emails, SMS, SEO et visibilité LLM de vos concurrents — et vous alerte en temps réel."
- CTAs : `btn-primary btn-lg` "Commencer gratuitement" + `btn-outline btn-lg` "Voir une démo"

**Colonne droite — App window mockup :**

Composant statique simulant une fenêtre d'application (pas de screenshot, pas d'asset externe).

Structure :
```
┌─────────────────────────────────┐
│ ● ● ●  spymark.app/dashboard   │  ← barre de titre (--surface-muted)
├─────────────────────────────────┤
│ [barre indigo] Publicités·META  │  Nike lance 3 nouvelles annonces  12min │
│ [barre verte]  Score LLM·ChatGPT│  Adidas — 78% (+12%)              1h   │
│ [barre orange] SEO·Title tag    │  Puma modifie sa balise title      2h   │
│ [barre grise]  Email·Newsletter │  Decathlon — Soldes d'été          3h   │
└─────────────────────────────────┘
```

Chaque ligne = `alert-row` : barre colored 3px + texte meta (mono) + valeur (Inter 500) + timestamp (mono droit).

---

### Features Bento

Grille 12 colonnes. 2 rangées.

| Cellule | Colspan | Contenu |
|---------|---------|---------|
| Publicités | 7 | Label PUBLICITÉS + titre + mini-ads grid 4 colonnes (fond gradient sombre) avec label platform mono en bas |
| LLM | 5 | Label VISIBILITÉ LLM + titre + 4 barres comparatives (Vous 68%, Nike 82%, Adidas 51%, Puma 34%) |
| SEO | 4 | Label SEO + titre + 2 diff items (border-left --border, rouge barré → vert nouveau) |
| Emails | 4 | Label EMAILS & NEWSLETTERS + titre + 2 email items (liste soudée, barre colored gauche) |
| SMS | 4 | Label SMS + titre + 2 sms items (barre colored gauche, texte) |

Chaque cellule : `background: --surface`, `border: 1px solid --border`, `border-radius: 12px`, `padding: 20px`.

---

### Stats

4 colonnes séparées par `border-left: 1px solid --border` (pas de fond card).

| Valeur | Label |
|--------|-------|
| `5` | Canaux surveillés |
| `24h` | Cycle de mise à jour |
| `2` | LLM providers |
| `100%` | Données isolées |

Valeur : Inter 700 / 36px / `--text`. Label : Inter 400 / 13px / `--text-muted`.

---

### Pricing

Grille 3 colonnes soudées (`gap: 1px`, fond container = `--border`, overflow hidden, border-radius 12px sur container).

| Plan | Prix | Features | CTA |
|------|------|----------|-----|
| **Free** | 0€ / Pour toujours | 3 concurrents · Pubs + SEO · 30j historique | "Commencer" (btn-outline) |
| **Pro** *(featured)* | 149€ / par mois | 20 concurrents · Tous les modules · 1 an historique · Alertes temps réel | "Essayer Pro" |
| **Enterprise** | Sur devis | Concurrents illimités · API dédiée · SSO/SAML · Support dédié | "Nous contacter" (btn-outline) |

Plan Pro : fond `--accent`, texte blanc, bouton `rgba(255,255,255,0.15)`. Pas de glow, pas de badge "Recommandé" pill — différentiation par fond accent uniquement.

Features pricing : `border-left: 2px solid --border` (blanc 30% pour Pro).

---

### Footer

- Fond : `#111110` hardcodé (jamais `--text` — doit rester sombre même en dark mode)
- Grille : `2fr 1fr 1fr 1fr`
- Colonne 1 : Logo + description Inter 13px `rgba(250,250,248,0.4)`
- Colonnes 2-4 : titre JetBrains Mono 10px uppercase + liens Inter 13px `rgba(250,250,248,0.5)`
- Bottom : Copyright + "Fait avec soin en France 🇫🇷" — JetBrains Mono 10px `rgba(250,250,248,0.25)`

---

## Application — Layout

### Shell global

```
┌──────────────┬────────────────────────┐
│   Sidebar    │        Main            │
│   212px      │   Topbar 48px          │
│   --surface  │   ─────────────────── │
│              │   Content (overflow)   │
└──────────────┴────────────────────────┘
```

Hauteur totale : `100vh`. Sidebar `overflow-y: auto`.

### Sidebar

- Logo : voir section Logo (22px, border-radius 5px)
- Item actif : `border-left: 2px solid --accent` + `background: --surface-muted` + `color: --text`
- Item inactif : `border-left: 2px solid transparent` + `color: --text-muted`
- **Comportement collapsible :** conservé tel quel (fonctionnalité existante, hors scope de la refonte)
- Footer sidebar : avatar carré 26px fond `--accent` + initiales blanches Inter 700 10px + nom Inter 600 12px + plan JetBrains Mono 9px `--accent`

### Topbar

- Hauteur 48px, `background: --surface`, `border-bottom: 1px solid --border`
- Gauche : titre Inter 600 14px + sous-titre JetBrains Mono 10px séparé par `border-left: 1px solid --border`
- Droite : actions (btn-outline sm + btn-primary sm)
- **Theme toggle** (même composant que LP) : placé à droite du topbar dans l'app.

### Dashboard

**KPI Grid :** 4 colonnes soudées (`gap: 1px`, fond container = `--border`).
- Chaque KPI card : `border-left: 3px solid transparent` → `.border-accent` si nouvelles données, `.border-changed` si alerte active
- Label : JetBrains Mono 10px uppercase `--text-muted`
- Valeur : Inter 700 / 28px / `--text`
- Variation : JetBrains Mono 11px, `--success` (↑) ou `--destructive` (↓) ou `--changed` (alerte)

**Tableau concurrents :**
- Header row : `background: --surface-muted`
- `<th>` : JetBrains Mono 10px uppercase `--text-muted`, padding `9px 16px`
- `<tr>` hover : `background: --surface-muted`
- `<tr>` avec alerte : `border-left: 3px solid --accent` (nouveau) ou `border-left: 3px solid --changed` (SEO)
- Score LLM : barre `3px` hauteur, `56px` largeur, fond `--surface-muted`, fill `--accent`
- Colonne Alertes : barre `3px × 12px` colorée inline + texte JetBrains Mono 11px coloré

### Discovery Feed

**Barre filtres :** sticky, `background: --surface`, `border-bottom: 1px solid --border`
- Search input : fond `--surface-muted`, border `--border`, border-radius `--radius-sm`, Inter 13px
- Platform pills : JetBrains Mono 10px uppercase, border-radius `3px` (carré), border `--border`
  - Actif : `border-color: --accent`, `color: --accent`, `background: --accent-subtle`

**Masonry :** 4 colonnes, gap 10px
- Card : `border: 1px solid --border`, `border-left: 3px solid transparent`
- Card nouvelle (isNew) : `border-left: 3px solid --accent`
- Hover : `translateY(-1px)` + `box-shadow: 0 4px 16px rgba(0,0,0,0.07)`, 180ms
- Footer card : brand Inter 600 12px + meta JetBrains Mono 9px uppercase

---

## Animations

| Élément | Spec |
|---------|------|
| Marquee parallax | `translateX` lié à `scrollY` via rAF. Respecte `prefers-reduced-motion`. |
| Hover cards/boutons | `translateY(-1px)` + `box-shadow` — `transition: all 180ms ease` |
| Sidebar items | `background` + `color` — `transition: all 120ms` |
| Theme switch | `transition: background 300ms, color 300ms` sur `body` |
| Focus rings (light) | `box-shadow: 0 0 0 3px rgba(79,110,247,0.12)` + `border-color: --accent` |
| Focus rings (dark) | `box-shadow: 0 0 0 3px rgba(79,110,247,0.25)` — opacité augmentée pour contraste |

---

## Implémentation — Fichiers à modifier

### `app/globals.css`
- Remplacer toutes les variables HSL par les valeurs hex des tokens
- Ajouter `.dark { ... }` avec les valeurs dark mode complètes
- Supprimer `.glass-card` et `.gradient-text`
- Ajouter `.border-accent`, `.border-changed`, `.border-success`, `.border-neutral`
- Ajouter `@media (prefers-reduced-motion: reduce)` pour `.marquee-track`

### `app/layout.tsx`
- Remplacer `Bricolage_Grotesque` + `DM_Sans` → `Inter` + `JetBrains_Mono`
- Ajouter `ThemeProvider` client component (lit localStorage + applique classe `.dark` sur `<html>`)

### `tailwind.config.ts`
- Mettre à jour les couleurs pour correspondre aux tokens CSS hex
- `fontFamily.sans` → Inter
- `fontFamily.mono` → JetBrains Mono
- Supprimer Bricolage Grotesque et DM Sans

### `components/landing/`
- `Navbar.tsx` : nouveau logo SVG, theme toggle (bouton soleil/lune)
- `Hero.tsx` : layout 2 colonnes, app window mockup statique, indicateurs bord
- `Features.tsx` : bento grid conservé, suppression glass-card et gradients
- `HowItWorks.tsx` : nettoyage visuel (garder structure, màj couleurs)
- `SocialProof.tsx` : suppression glass-card
- `Pricing.tsx` : grille soudée, featured = fond accent plein (no glow)
- `CtaSection.tsx` : simplification ou suppression si footer suffit
- `Footer.tsx` : fond `#111110` hardcodé
- **Nouveau :** `MarqueeLabel.tsx` — composant réutilisable avec props `words`, `direction`, `speed`

### `components/feed/DiscoveryCard.tsx`
- Supprimer overlay gradient hover complexe
- Ajouter `border-left: 3px solid --accent` conditionnel si `isNew`
- Màj métadonnées en JetBrains Mono

### `components/layout/Sidebar.tsx`
- Remplacer `.sidebar-item-active` → border-left 2px accent
- Màj couleurs tokens

### `middleware.ts` + routes auth
- Hors scope design — ne pas toucher

---

## Non-implémenté (hors scope)

- Animations d'entrée au scroll (Framer Motion stagger)
- Page de détail concurrent
- Composants Email/SMS/SEO individuels
- Responsive mobile
- Composant `HowItWorks` (màj couleurs uniquement)
