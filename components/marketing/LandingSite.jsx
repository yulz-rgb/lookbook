'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Anchor, Menu, X } from 'lucide-react';
import { EnquiryForm } from './EnquiryForm';
import { siteConfig } from '../../lib/site';

const NAV = [
  { href: '#services', label: 'Services' },
  { href: '#why-us', label: 'Why us' },
  { href: '#process', label: 'Process' },
  { href: '#lookbook', label: 'Lookbook' },
  { href: '#contact', label: 'Contact' },
];

const SERVICES = [
  {
    title: 'Deck & bridge',
    desc: 'Epaulettes, shorts, technical shirts, and outerwear suited to sun, salt, and long watches.',
  },
  {
    title: 'Interior & guest areas',
    desc: 'Refined service uniforms, spa wear, and galley attire that match your vessel\'s guest experience.',
  },
  {
    title: 'Custom branding',
    desc: 'Embroidery, yacht crests, and colour-matched trims — planned in the lookbook before anything is ordered.',
  },
  {
    title: 'Procurement handoff',
    desc: 'Per-supplier purchase orders with quantities, sizes, MOQ checks, and budget totals ready to approve.',
  },
];

const DIFFERENTIATORS = [
  {
    title: 'Built for yacht operations',
    desc: 'Role-based looks for captains, deck, engineering, interior, galley, and spa — not generic hospitality templates.',
  },
  {
    title: 'Sizing before spend',
    desc: 'Crew size profiles and spare allowances are captured upfront so orders reflect real headcount and fit.',
  },
  {
    title: 'Approval workflow',
    desc: 'Draft → captain review → owner approval with locked totals, so sign-off happens before procurement.',
  },
  {
    title: 'Per-yacht isolation',
    desc: 'Each vessel has its own catalog, crew roster, and order history — private and invite-only for your team.',
  },
];

const STEPS = [
  { num: '01', title: 'Define the brief', desc: 'Share vessel type, crew count, departments, and branding requirements.' },
  { num: '02', title: 'Build looks', desc: 'Compose uniform sets in the lookbook — preview on mannequin, compare options, forecast budget.' },
  { num: '03', title: 'Confirm sizing', desc: 'Import or enter crew measurements; flag missing sizes and fit mismatches early.' },
  { num: '04', title: 'Approve & order', desc: 'Captain and owner sign off, then export supplier-ready CSV and PDF purchase orders.' },
];

export function LandingSite() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen, closeMenu]);

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link href="/" className="landing-logo" aria-label={`${siteConfig.name} home`}>
            <span className="landing-logo-icon" aria-hidden="true"><Anchor size={18} /></span>
            <span className="landing-logo-text">
              <strong>Yacht Uniform</strong>
              <span>Lookbook</span>
            </span>
          </Link>
          <nav className="landing-nav" aria-label="Main">
            {NAV.map(({ href, label }) => (
              <a key={href} href={href} className="landing-nav-link">{label}</a>
            ))}
          </nav>
          <div className="landing-header-cta">
            <Link href="/demo" className="btn ghost">Try demo</Link>
            <Link href="/sign-in" className="btn primary">Sign in</Link>
          </div>
          <button
            type="button"
            className="landing-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-nav" className="landing-mobile-nav" aria-label="Mobile">
            {NAV.map(({ href, label }) => (
              <a key={href} href={href} className="landing-mobile-link" onClick={closeMenu}>{label}</a>
            ))}
            <Link href="/demo" className="btn ghost" onClick={closeMenu}>Try demo</Link>
            <Link href="/sign-in" className="btn primary" onClick={closeMenu}>Sign in</Link>
          </nav>
        )}
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="hero-heading">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">Yacht crew uniform planning</p>
              <h1 id="hero-heading">Uniform programmes your captain can approve — before a single garment is ordered.</h1>
              <p className="landing-lead">
                Plan crew looks, manage sizing across departments, forecast total spend including embroidery and spares,
                and export procurement-ready orders — built for superyachts, management companies, and interior teams.
              </p>
              <div className="landing-hero-actions">
                <Link href="/demo" className="btn primary btn-lg">Explore the lookbook</Link>
                <a href="#contact" className="btn secondary btn-lg">Request a consultation</a>
              </div>
              <ul className="landing-trust-strip" aria-label="Key capabilities">
                <li>Per-yacht workspace</li>
                <li>Budget forecasting</li>
                <li>Supplier-ready exports</li>
              </ul>
            </div>
            <div className="landing-hero-visual" aria-hidden="true">
              <div className="hero-card hero-card--main">
                <span className="hero-card-label">Interior service look</span>
                <div className="hero-mannequin" />
                <div className="hero-card-meta">
                  <span>12 crew · 2 sets each</span>
                  <strong>€18,420 est.</strong>
                </div>
              </div>
              <div className="hero-card hero-card--side">
                <span className="hero-card-label">Captain review</span>
                <p>Deck + interior looks ready for approval</p>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="landing-section" aria-labelledby="services-heading">
          <div className="landing-container">
            <header className="landing-section-head">
              <p className="landing-eyebrow">What we help you deliver</p>
              <h2 id="services-heading">Complete uniform programmes for every department on board</h2>
              <p className="landing-section-lead">
                From bridge epaulettes to guest-area service attire — plan every garment category with
                role-specific looks, supplier pricing, and lead-time visibility.
              </p>
            </header>
            <ul className="landing-card-grid">
              {SERVICES.map(({ title, desc }) => (
                <li key={title} className="landing-card">
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="why-us" className="landing-section landing-section--alt" aria-labelledby="why-heading">
          <div className="landing-container landing-split">
            <header className="landing-section-head">
              <p className="landing-eyebrow">Why teams choose us</p>
              <h2 id="why-heading">Less spreadsheet chaos. More confident procurement.</h2>
              <p className="landing-section-lead">
                Most uniform projects fail in the handoff — unclear sizing, surprise costs, or orders sent before
                the owner has seen a total. The lookbook keeps planning, approval, and ordering in one place.
              </p>
            </header>
            <ul className="landing-feature-list">
              {DIFFERENTIATORS.map(({ title, desc }) => (
                <li key={title}>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="process" className="landing-section" aria-labelledby="process-heading">
          <div className="landing-container">
            <header className="landing-section-head landing-section-head--center">
              <p className="landing-eyebrow">How it works</p>
              <h2 id="process-heading">From brief to approved order in four steps</h2>
            </header>
            <ol className="landing-steps">
              {STEPS.map(({ num, title, desc }) => (
                <li key={num} className="landing-step">
                  <span className="landing-step-num" aria-hidden="true">{num}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="lookbook" className="landing-section landing-section--dark" aria-labelledby="lookbook-heading">
          <div className="landing-container landing-lookbook-cta">
            <div>
              <p className="landing-eyebrow landing-eyebrow--light">Interactive lookbook</p>
              <h2 id="lookbook-heading">See the configurator in action — no sign-in required</h2>
              <p>
                Browse the demo catalog, build crew looks on the mannequin preview, run budget calculations,
                and export sample procurement documents. Your team can evaluate the workflow before onboarding.
              </p>
            </div>
            <Link href="/demo" className="btn gold btn-lg">Open demo lookbook</Link>
          </div>
        </section>

        <section id="contact" className="landing-section" aria-labelledby="contact-heading">
          <div className="landing-container landing-contact-grid">
            <div className="landing-contact-info">
              <p className="landing-eyebrow">Get started</p>
              <h2 id="contact-heading">Tell us about your vessel</h2>
              <p>
                Share your crew count, departments, and timeline. We will respond within one business day
                with next steps for setting up your yacht workspace or arranging a walkthrough.
              </p>
              <dl className="landing-contact-details">
                <div>
                  <dt>Email</dt>
                  <dd><a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a></dd>
                </div>
                <div>
                  <dt>Service area</dt>
                  <dd>{siteConfig.serviceArea}</dd>
                </div>
                <div>
                  <dt>For existing clients</dt>
                  <dd><Link href="/sign-in">Sign in to your workspace</Link></dd>
                </div>
              </dl>
            </div>
            <EnquiryForm />
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-grid">
          <div className="landing-footer-brand">
            <Link href="/" className="landing-logo landing-logo--footer">
              <span className="landing-logo-icon" aria-hidden="true"><Anchor size={16} /></span>
              <strong>Yacht Uniform Lookbook</strong>
            </Link>
            <p>{siteConfig.tagline}</p>
          </div>
          <nav aria-label="Footer">
            <ul className="landing-footer-links">
              <li><a href="#services">Services</a></li>
              <li><a href="#process">Process</a></li>
              <li><Link href="/demo">Demo</Link></li>
              <li><Link href="/sign-in">Sign in</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
            </ul>
          </nav>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} Yacht Uniform Lookbook. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
