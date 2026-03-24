import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const metadata = {
  title: "Conditions générales d'utilisation | SpyMark",
  description: "Conditions générales d'utilisation du service SpyMark.",
}

export default function CGUPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#FAFAF8', minHeight: '100vh', paddingTop: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: 16 }}>
            Légal
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#111110', marginBottom: 8, lineHeight: 1.2 }}>
            Conditions générales d&apos;utilisation
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 48 }}>
            Dernière mise à jour : mars 2026
          </p>

          <div style={{ fontSize: 15, lineHeight: 1.8, color: '#374151' }} className="flex flex-col gap-10">

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>1. Acceptation des conditions</h2>
              <p>En accédant et en utilisant SpyMark, vous acceptez d&apos;être lié par les présentes Conditions Générales d&apos;Utilisation. Si vous n&apos;acceptez pas ces conditions, vous ne pouvez pas utiliser le service.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>2. Description du service</h2>
              <p>SpyMark est une plateforme SaaS de veille concurrentielle automatisée permettant de surveiller les publicités, emails, SMS, données SEO et la visibilité des marques dans les moteurs de recherche IA. Le service est accessible via abonnement mensuel ou annuel.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>3. Compte utilisateur</h2>
              <p>Pour accéder à SpyMark, vous devez créer un compte avec une adresse email valide. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les actions effectuées depuis votre compte. SpyMark ne peut être tenu responsable de tout accès non autorisé résultant de votre négligence.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>4. Utilisation acceptable</h2>
              <p>Vous vous engagez à ne pas :</p>
              <ul style={{ paddingLeft: 20, marginTop: 8 }} className="flex flex-col gap-2">
                <li>Utiliser le service à des fins illégales ou contraires aux présentes CGU</li>
                <li>Tenter de contourner les limitations de votre plan d&apos;abonnement</li>
                <li>Revendre ou redistribuer les données collectées via SpyMark</li>
                <li>Utiliser des scripts automatisés pour accéder à l&apos;API sans autorisation</li>
                <li>Porter atteinte à la sécurité ou à l&apos;intégrité de la plateforme</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>5. Abonnement et facturation</h2>
              <p>Les abonnements sont facturés mensuellement ou annuellement selon votre choix. Les paiements sont traités par Stripe. Tout abonnement est automatiquement renouvelé sauf résiliation avant la date de renouvellement. Aucun remboursement n&apos;est accordé pour les périodes déjà facturées, sauf dans les cas prévus par la loi.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>6. Propriété intellectuelle</h2>
              <p>SpyMark et son contenu (interface, algorithmes, marque) sont protégés par le droit de la propriété intellectuelle. Vous conservez la propriété des données que vous saisissez dans le service. Vous accordez à SpyMark une licence limitée pour traiter ces données dans le seul but de vous fournir le service.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>7. Limitation de responsabilité</h2>
              <p>SpyMark fournit le service &quot;en l&apos;état&quot;. Nous ne garantissons pas l&apos;exhaustivité ou la précision des données collectées sur des tiers. SpyMark ne saurait être tenu responsable des décisions prises sur la base des informations fournies par la plateforme. Notre responsabilité est limitée au montant des sommes versées au cours des 3 derniers mois.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>8. Résiliation</h2>
              <p>Vous pouvez résilier votre abonnement à tout moment depuis les paramètres de votre compte. SpyMark se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU, sans préavis ni remboursement.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>9. Droit applicable</h2>
              <p>Les présentes CGU sont soumises au droit français. Tout litige sera soumis à la compétence exclusive des tribunaux de Paris, sauf disposition légale contraire.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>10. Contact</h2>
              <p>Pour toute question relative aux présentes CGU : <a href="mailto:legal@spymark.io" style={{ color: '#4F6EF7' }}>legal@spymark.io</a></p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
