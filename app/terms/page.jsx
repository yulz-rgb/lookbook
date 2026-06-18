import Link from 'next/link';
import { siteConfig } from '../../lib/site';

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-card">
        <h1>Terms of use</h1>
        <p className="legal-updated">Last updated: June 2026</p>
        <p>
          By using Yacht Uniform Lookbook you agree to use the platform for legitimate yacht uniform
          planning purposes. The demo environment uses sample catalog data for evaluation only.
        </p>
        <h2>Service</h2>
        <p>
          The lookbook is a planning and procurement preparation tool. Pricing shown in catalogs is indicative;
          confirm quotes with suppliers before placing orders. We are not responsible for supplier fulfilment.
        </p>
        <h2>Accounts</h2>
        <p>
          Workspaces are invite-only and isolated per yacht. You are responsible for maintaining access
          to your account and for data entered by your team.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about these terms:{' '}
          <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
        </p>
        <p><Link href="/">← Back to home</Link></p>
      </div>
    </div>
  );
}
