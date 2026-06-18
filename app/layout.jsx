import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import { hasClerk } from '../lib/config';

export const metadata = {
  title: 'Yacht Uniform Lookbook',
  description:
    'Interactive yacht crew uniform configurator — build looks, manage crew sizing, plan budgets, and export procurement-ready lookbooks.',
};

export default function RootLayout({ children }) {
  const body = (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
  return hasClerk ? <ClerkProvider>{body}</ClerkProvider> : body;
}
