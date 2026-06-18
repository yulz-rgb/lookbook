import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import { hasClerk } from '../lib/config';
import { siteConfig } from '../lib/site';
import { ChunkLoadRecovery } from '../components/ChunkLoadRecovery';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata = {
  title: {
    default: `${siteConfig.name} — Yacht Crew Uniform Planning`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
};

// Brand the hosted Clerk widgets so the first screen every persona sees reads as
// "Yacht Uniform Lookbook" rather than the raw Clerk instance name.
const clerkAppearance = {
  variables: {
    colorPrimary: '#0a2540',
    colorText: '#0f172a',
    colorTextSecondary: '#64748b',
    colorBackground: '#ffffff',
    colorInputBackground: '#f7f9fc',
    borderRadius: '12px',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  elements: {
    card: { boxShadow: '0 12px 40px rgba(10,37,64,.14)' },
    headerTitle: { fontWeight: 800 },
    logoBox: { display: 'none' },
  },
};

export default function RootLayout({ children }) {
  const body = (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        <ChunkLoadRecovery />
        {children}
        <Analytics />
      </body>
    </html>
  );
  return hasClerk
    ? (
      <ClerkProvider
        appearance={clerkAppearance}
        signInFallbackRedirectUrl="/workspace"
        signUpFallbackRedirectUrl="/workspace"
      >
        {body}
      </ClerkProvider>
    )
    : body;
}
