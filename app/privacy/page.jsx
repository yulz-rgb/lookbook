import Link from 'next/link';
import { siteConfig } from '../../lib/site';

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-card">
        <h1>Privacy policy</h1>
        <p className="legal-updated">Last updated: June 2026</p>
        <p>
          Yacht Uniform Lookbook processes account and workspace data for yacht crew uniform planning.
          When you sign in, authentication is handled by Clerk. Operational data (catalogs, crew, orders)
          is stored per yacht and accessible only to invited members of that yacht.
        </p>
        <h2>Data we collect</h2>
        <ul>
          <li>Account information (name, email) via Clerk when you register or sign in.</li>
          <li>Workspace data you enter: products, looks, crew sizing, orders, and exports.</li>
          <li>Enquiry form submissions when you contact us via the website.</li>
          <li>Anonymous usage analytics via Vercel Analytics (no personal profiling).</li>
        </ul>
        <h2>How we use data</h2>
        <p>
          Data is used to provide the lookbook service, process uniform enquiries, and improve reliability.
          We do not sell personal data. Enquiries submitted without a database connection are logged server-side
          only when persistence or a webhook is configured.
        </p>
        <h2>Contact</h2>
        <p>
          For privacy questions, email{' '}
          <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
        </p>
        <p><Link href="/">← Back to home</Link></p>
      </div>
    </div>
  );
}
