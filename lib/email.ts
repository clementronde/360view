/**
 * Email sending via Resend API (no SDK needed — direct fetch)
 * Requires RESEND_API_KEY in environment variables.
 */

const RESEND_API = 'https://api.resend.com/emails'
const FROM = process.env.RESEND_FROM_EMAIL ?? 'alerts@spymark.io'

export interface SendEmailOpts {
  to: string
  subject: string
  html: string
}

export async function sendEmail(opts: SendEmailOpts): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping email')
    return false
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[email] Resend error:', err)
      return false
    }
    return true
  } catch (err) {
    console.error('[email] sendEmail failed:', err)
    return false
  }
}

// ─── Alert templates ──────────────────────────────────────────────────────────

export function newAdAlertHtml(opts: {
  competitorName: string
  platform: string
  adTitle?: string | null
  adImageUrl?: string | null
  dashboardUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e4e4e7">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;padding:32px 24px">
    <tr><td>
      <!-- Header -->
      <div style="margin-bottom:28px">
        <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7c3aed;font-family:monospace">SPYMARK</span>
      </div>

      <!-- Title -->
      <h1 style="font-size:18px;font-weight:700;margin:0 0 8px;color:#fafafa">
        Nouvelle pub détectée — ${opts.competitorName}
      </h1>
      <p style="font-size:13px;color:#71717a;margin:0 0 24px">
        Plateforme : <strong style="color:#a1a1aa">${opts.platform}</strong>
        ${opts.adTitle ? `&nbsp;·&nbsp;<em style="color:#a1a1aa">${opts.adTitle}</em>` : ''}
      </p>

      ${opts.adImageUrl ? `
      <!-- Ad preview -->
      <div style="margin-bottom:24px;border-radius:12px;overflow:hidden;border:1px solid #27272a">
        <img src="${opts.adImageUrl}" alt="Creative" style="width:100%;display:block;max-height:300px;object-fit:cover">
      </div>` : ''}

      <!-- CTA -->
      <a href="${opts.dashboardUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600">
        Voir la publicité →
      </a>

      <!-- Footer -->
      <p style="font-size:11px;color:#3f3f46;margin-top:32px">
        Vous recevez cet email car vous suivez ${opts.competitorName} sur SpyMark.<br>
        <a href="${opts.dashboardUrl}/settings" style="color:#52525b">Gérer les alertes</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`
}

export function seoChangeAlertHtml(opts: {
  competitorName: string
  changedFields: string[]
  dashboardUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e4e4e7">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;padding:32px 24px">
    <tr><td>
      <div style="margin-bottom:28px">
        <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7c3aed;font-family:monospace">SPYMARK</span>
      </div>
      <h1 style="font-size:18px;font-weight:700;margin:0 0 8px;color:#fafafa">
        Changement SEO détecté — ${opts.competitorName}
      </h1>
      <p style="font-size:13px;color:#71717a;margin:0 0 16px">Champs modifiés :</p>
      <ul style="margin:0 0 24px;padding-left:20px">
        ${opts.changedFields.map(f => `<li style="color:#a1a1aa;font-size:13px;margin-bottom:4px">${f}</li>`).join('')}
      </ul>
      <a href="${opts.dashboardUrl}/seo" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600">
        Voir les changements →
      </a>
    </td></tr>
  </table>
</body>
</html>`
}
