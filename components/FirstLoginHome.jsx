'use client';

import { useRef, useState } from 'react';
import { Pencil, Upload, X } from 'lucide-react';
import Workspace from './Workspace';

const NAVY = '#0b1f3a';

export default function FirstLoginHome() {
  const [vesselName, setVesselName] = useState('M/Y CONFIDENTIAL');
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('M/Y CONFIDENTIAL');
  const [manualMode, setManualMode] = useState(false);
  const inputRef = useRef(null);

  function saveName() {
    const next = draftName.trim() || 'M/Y CONFIDENTIAL';
    setVesselName(next);
    setDraftName(next);
    setEditing(false);
  }

  if (manualMode) return <Workspace mode="local" canUpload={false} isDemo />;

  return (
    <main style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      backgroundImage: 'url(/onboarding-yacht.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: NAVY,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'grid',
      placeItems: 'center',
      padding: '28px 24px',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(244,248,252,.04), rgba(237,243,248,.08))',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'fixed',
        top: 27,
        left: 31,
        zIndex: 2,
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: 22,
        letterSpacing: '-.025em',
        color: NAVY,
      }}>
        YachtUniform
      </div>

      <div style={{
        position: 'fixed',
        top: 23,
        right: 31,
        zIndex: 2,
        width: 35,
        height: 35,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(213,223,234,.78)',
        color: '#445b77',
        fontSize: 12,
        fontWeight: 700,
      }}>
        CS
      </div>

      <section style={{
        position: 'relative',
        zIndex: 1,
        width: 'min(760px, calc(100vw - 36px))',
        borderRadius: 34,
        border: '1px solid rgba(255,255,255,.8)',
        background: 'rgba(248,250,253,.76)',
        backdropFilter: 'blur(22px) saturate(115%)',
        WebkitBackdropFilter: 'blur(22px) saturate(115%)',
        boxShadow: '0 24px 70px rgba(18,38,63,.18)',
        padding: 'clamp(48px, 7vw, 70px) clamp(28px, 6vw, 54px)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 39,
          lineHeight: 1,
          marginBottom: 30,
          opacity: .48,
          fontFamily: 'Georgia, Times New Roman, serif',
        }}>
          ≋
        </div>

        {!editing ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <h1 style={{
              margin: 0,
              fontFamily: 'Georgia, Times New Roman, serif',
              fontSize: 'clamp(32px, 6vw, 58px)',
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: '.01em',
              color: NAVY,
            }}>
              {vesselName}
            </h1>
            <button
              type="button"
              onClick={() => { setDraftName(vesselName); setEditing(true); }}
              aria-label="Edit yacht name"
              title="Edit yacht name"
              style={{ border: 0, background: 'transparent', color: NAVY, cursor: 'pointer', padding: 6 }}
            >
              <Pencil size={18} strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
                if (e.key === 'Escape') setEditing(false);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: 'Georgia, Times New Roman, serif',
                fontSize: 'clamp(26px, 5vw, 42px)',
                fontWeight: 400,
                padding: '8px 10px',
                border: '1px solid rgba(11,31,58,.16)',
                borderRadius: 12,
                outline: 'none',
                background: 'rgba(255,255,255,.82)',
                color: NAVY,
              }}
            />
            <button type="button" onClick={saveName} style={{ border: 0, background: NAVY, color: '#fff', padding: '11px 15px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            <button type="button" onClick={() => setEditing(false)} aria-label="Cancel edit" style={{ border: 0, background: 'transparent', color: NAVY, cursor: 'pointer', padding: 7 }}><X size={18} /></button>
          </div>
        )}

        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.pdf" style={{ display: 'none' }} />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: '100%',
            minHeight: 228,
            marginTop: 'clamp(42px, 6vw, 60px)',
            border: '1px dashed rgba(11,31,58,.18)',
            borderRadius: 28,
            background: 'rgba(255,255,255,.72)',
            color: NAVY,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 19,
            padding: 30,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)',
          }}
        >
          <span style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'rgba(230,237,245,.92)',
            display: 'grid',
            placeItems: 'center',
          }}>
            <Upload size={34} strokeWidth={1.5} />
          </span>
          <span style={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 400, lineHeight: 1.2 }}>
            Import current crew, sizes & inventory
          </span>
          <span style={{ fontSize: 12, letterSpacing: '.24em', color: '#7f8ea3' }}>
            Excel · CSV · PDF
          </span>
        </button>

        <button
          type="button"
          onClick={() => setManualMode(true)}
          style={{
            marginTop: 32,
            border: 0,
            borderBottom: '1px solid rgba(11,31,58,.45)',
            background: 'transparent',
            color: NAVY,
            fontSize: 14,
            cursor: 'pointer',
            padding: '2px 0 3px',
          }}
        >
          No file? Start manually →
        </button>
      </section>
    </main>
  );
}
