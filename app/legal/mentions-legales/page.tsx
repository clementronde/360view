import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const metadata = {
  title: 'Mentions légales | SpyMark',
  description: 'Mentions légales de SpyMark.',
}

export default function MentionsLegalesPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: '#FAFAF8', minHeight: '100vh', paddingTop: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
          <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: 16 }}>
            Légal
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#111110', marginBottom: 8, lineHeight: 1.2 }}>
            Mentions légales
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 48 }}>
            Conformément à l&apos;article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique.
          </p>

          <div style={{ fontSize: 15, lineHeight: 1.8, color: '#374151' }} className="flex flex-col gap-10">

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>Éditeur du site</h2>
              <p><strong>SpyMark SAS</strong></p>
              <p>Société par actions simplifiée au capital de [X] €</p>
              <p>Siège social : France</p>
              <p>SIRET : en cours d&apos;immatriculation</p>
              <p>Email : <a href="mailto:contact@spymark.io" style={{ color: '#4F6EF7' }}>contact@spymark.io</a></p>
              <p>Directeur de la publication : [Nom du dirigeant]</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>Hébergement</h2>
              <p><strong>Vercel Inc.</strong></p>
              <p>340 Pine Street, Suite 701</p>
              <p>San Francisco, CA 94104, États-Unis</p>
              <p><a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4F6EF7' }}>vercel.com</a></p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>Propriété intellectuelle</h2>
              <p>L&apos;ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, sons, logiciels…) est la propriété exclusive de SpyMark SAS, à l&apos;exception des marques, logos ou contenus appartenant à d&apos;autres sociétés partenaires ou auteurs.</p>
              <p style={{ marginTop: 8 }}>Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces différents éléments est strictement interdite sans l&apos;accord exprès par écrit de SpyMark SAS.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>Données personnelles</h2>
              <p>Le traitement des données personnelles est régi par notre <a href="/legal/confidentialite" style={{ color: '#4F6EF7' }}>Politique de confidentialité</a>. Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données personnelles.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>Cookies</h2>
              <p>Ce site utilise des cookies techniques nécessaires à son fonctionnement. Vous pouvez configurer votre navigateur pour refuser les cookies, ce qui peut affecter certaines fonctionnalités du service.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>Limitation de responsabilité</h2>
              <p>SpyMark SAS s&apos;efforce d&apos;assurer au mieux l&apos;exactitude et la mise à jour des informations diffusées sur ce site. Cependant, SpyMark SAS ne peut garantir l&apos;exactitude, la complétude et l&apos;actualité des informations diffusées et décline toute responsabilité pour les erreurs ou omissions.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111110', marginBottom: 12 }}>Droit applicable</h2>
              <p>Le présent site et les présentes mentions légales sont soumis au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
