import { ImageResponse } from 'next/og';
import { siteConfig } from '../lib/site';

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #061a2e 0%, #0a2540 50%, #163d6b 100%)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: '#c9a227', marginBottom: 24 }}>
          Yacht Uniform Lookbook
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.15, maxWidth: 900, letterSpacing: '-0.02em' }}>
          Maritime crew uniform planning
        </div>
        <div style={{ fontSize: 28, marginTop: 24, color: '#b9c9dc', maxWidth: 800, lineHeight: 1.4 }}>
          From first look to final order — sizing, budgets, and procurement-ready exports.
        </div>
      </div>
    ),
    { ...size },
  );
}
