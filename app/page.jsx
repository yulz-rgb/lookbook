import { LandingSite } from '../components/marketing/LandingSite';
import { siteConfig } from '../lib/site';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  areaServed: siteConfig.serviceArea,
  email: siteConfig.contactEmail,
  serviceType: 'Yacht crew uniform planning and procurement preparation',
};

export const metadata = {
  title: {
    default: `${siteConfig.name} — Yacht Crew Uniform Planning`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Yacht Crew Uniform Planning`,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — Yacht Crew Uniform Planning`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingSite />
    </>
  );
}
