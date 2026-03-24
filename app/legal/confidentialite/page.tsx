import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const metadata = {
  title: 'Politique de confidentialité | SpyMark',
  description: 'Politique de confidentialité et traitement des données personnelles de SpyMark.',
}

export default function ConfidentialitePage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#FAFAF8', minHeight: '100vh', paddingTop: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: 16 }}>
            Légal
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#111110', marginBottom: 8, lineHeight: 1.2 }}>
            Politique de confidentialité
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 48 }}>
            Dernière mise à jour : mars 2026
          </p>

          <div style={{ fontSize: 15, lineHeight: 1.8, color: '#374151' }} className="flex flex-col gap-10">

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>1. Qui sommes-nous ?</h2>
              <p>SpyMark est un service de veille concurrentielle automatisée édité par SpyMark SAS, société française. Notre plateforme permet de surveiller les publicités, emails, SMS, données SEO et visibilité LLM de vos concurrents.</p>
              <p style={{ marginTop: 8 }}>Contact : <a href="mailto:privacy@spymark.io" style={{ color: '#4F6EF7' }}>privacy@spymark.io</a></p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>2. Données collectées</h2>
              <p>Nous collectons les données suivantes :</p>
              <ul style={{ paddingLeft: 20, marginTop: 8 }} className="flex flex-col gap-2">
                <li><strong>Données de compte :</strong> nom, adresse email, mot de passe hashé</li>
                <li><strong>Données d'utilisation :</strong> pages visitées, actions effectuées, fréquence de connexion</li>
                <li><strong>Données de facturation :</strong> informations de paiement traitées via Stripe (nous ne stockons pas les numéros de carte)</li>
                <li><strong>Données de surveillance :</strong> URLs et noms des concurrents que vous ajoutez à votre espace</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>3. Utilisation des données</h2>
              <p>Vos données sont utilisées exclusivement pour :</p>
              <ul style={{ paddingLeft: 20, marginTop: 8 }} className="flex flex-col gap-2">
                <li>Fournir et améliorer le service SpyMark</li>
                <li>Vous envoyer les alertes et digest hebdomadaires que vous avez activés</li>
                <li>Assurer la sécurité et prévenir les abus</li>
                <li>Respecter nos obligations légales</li>
              </ul>
              <p style={{ marginTop: 8 }}>Nous ne vendons jamais vos données à des tiers.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>4. Cookies</h2>
              <p>SpyMark utilise des cookies strictement nécessaires au fonctionnement du service (session d'authentification) et des cookies analytiques anonymisés pour comprendre l'usage de la plateforme. Vous pouvez refuser les cookies analytiques sans impact sur votre accès au service.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>5. Hébergement & sous-traitants</h2>
              <ul style={{ paddingLeft: 20, marginTop: 8 }} className="flex flex-col gap-2">
                <li><strong>Vercel</strong> — hébergement de l'application (San Francisco, CA)</li>
                <li><strong>Supabase</strong> — base de données et stockage (EU)</li>
                <li><strong>Clerk</strong> — authentification (données en EU)</li>
                <li><strong>Stripe</strong> — paiement (certifié PCI-DSS niveau 1)</li>
                <li><strong>Resend</strong> — envoi d'emails transactionnels</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>6. Vos droits (RGPD)</h2>
              <p>Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :</p>
              <ul style={{ paddingLeft: 20, marginTop: 8 }} className="flex flex-col gap-2">
                <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
                <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
                <li><strong>Droit à l'effacement</strong> — supprimer votre compte et vos données</li>
                <li><strong>Droit à la portabilité</strong> — exporter vos données au format JSON</li>
                <li><strong>Droit d'opposition</strong> — vous opposer au traitement à des fins marketing</li>
              </ul>
              <p style={{ marginTop: 8 }}>Pour exercer ces droits : <a href="mailto:privacy@spymark.io" style={{ color: '#4F6EF7' }}>privacy@spymark.io</a></p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>7. Conservation des données</h2>
              <p>Vos données sont conservées pendant toute la durée de votre abonnement et supprimées dans les 30 jours suivant la résiliation de votre compte, sauf obligation légale contraire (données de facturation conservées 10 ans).</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>8. Contact & réclamations</h2>
              <p>Pour toute question relative à vos données : <a href="mailto:privacy@spymark.io" style={{ color: '#4F6EF7' }}>privacy@spymark.io</a></p>
              <p style={{ marginTop: 8 }}>En cas de litige, vous pouvez également contacter la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#4F6EF7' }}>CNIL</a>.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
