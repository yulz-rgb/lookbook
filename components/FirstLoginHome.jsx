'use client';

import { useRef, useState } from 'react';
import { FileSpreadsheet, Pencil, Upload, X } from 'lucide-react';
import Workspace from './Workspace';

const NAVY = '#0b1f3a';
const NAVY_SOFT = '#183657';
const TEXT = '#172033';
const MUTED = '#7b8798';
const LINE = '#e7ebf0';
const WASH = '#f6f8fb';

export default function FirstLoginHome() {
  const [vesselName, setVesselName] = useState('M/Y CONFIDENTIAL');
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('M/Y CONFIDENTIAL');
  const [file, setFile] = useState(null);
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
      background: '#ffffff',
      color: TEXT,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <header style={{
        height: 66,
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid ${LINE}`,
        padding: '0 32px',
        background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 27,
            height: 27,
            borderRadius: 8,
            background: NAVY,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '-.02em',
          }}>Y</div>
          <span style={{ fontSize: 15, fontWeight: 760, color: NAVY, letterSpacing: '-.015em' }}>YachtUniform</span>
        </div>
      </header>

      <section style={{
        width: 'min(720px, calc(100% - 40px))',
        margin: '0 auto',
        padding: 'clamp(52px, 8vw, 92px) 0 56px',
      }}>
        <div style={{ marginBottom: 42 }}>
          {!editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <h1 style={{
                margin: 0,
                fontSize: 'clamp(28px, 4.5vw, 40px)',
                lineHeight: 1.08,
                letterSpacing: '-.04em',
                fontWeight: 720,
                color: NAVY,
              }}>{vesselName}</h1>
              <button
                type="button"
                onClick={() => { setDraftName(vesselName); setEditing(true); }}
                aria-label="Edit yacht name"
                title="Edit yacht name"
                style={{
                  border: 0,
                  background: 'transparent',
                  color: '#9aa4b2',
                  cursor: 'pointer',
                  padding: 6,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 8,
                }}
              ><Pencil size={16} strokeWidth={1.7}/></button>
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
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: '-.03em',
                  padding: '9px 11px',
                  border: `1px solid ${LINE}`,
                  borderRadius: 10,
                  outline: 'none',
                  background: '#fff',
                  color: NAVY,
                  boxShadow: '0 0 0 3px rgba(11,31,58,.04)',
                }}
              />
              <button
                type="button"
                onClick={saveName}
                style={{ border: 0, background: NAVY, color: '#fff', padding: '10px 15px', borderRadius: 9, fontWeight: 700, cursor: 'pointer' }}
              >Save</button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Cancel edit"
                style={{ border: 0, background: 'transparent', color: MUTED, cursor: 'pointer', padding: 7 }}
              ><X size={17}/></button>
            </div>
          )}
          <p style={{ margin: '9px 0 0', color: MUTED, fontSize: 13.5 }}>
            Keep your yacht confidential, or add the name if you prefer.
          </p>
        </div>

        <div style={{ marginBottom: 18 }}>
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(21px, 3vw, 27px)',
            lineHeight: 1.2,
            letterSpacing: '-.03em',
            fontWeight: 700,
            color: TEXT,
          }}>
            Import your current crew & uniform file
          </h2>
          <p style={{
            margin: '10px 0 0',
            color: '#667085',
            lineHeight: 1.55,
            fontSize: 14.5,
            maxWidth: 590,
          }}>
            Use the file you already have. We’ll organise your crew, sizes and uniform inventory from it.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: '100%',
            minHeight: 156,
            border: `1px solid ${file ? '#c8d5e5' : LINE}`,
            borderRadius: 14,
            background: file ? '#f3f7fb' : WASH,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            color: NAVY,
            padding: '26px 28px',
            textAlign: 'left',
            transition: 'background .16s ease, border-color .16s ease, transform .16s ease',
          }}
        >
          <span style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: '#fff',
            border: `1px solid ${LINE}`,
            display: 'grid',
            placeItems: 'center',
            flex: '0 0 auto',
            color: NAVY_SOFT,
            boxShadow: '0 2px 8px rgba(11,31,58,.05)',
          }}>
            {file ? <FileSpreadsheet size={21} strokeWidth={1.7}/> : <Upload size={21} strokeWidth={1.7}/>} 
          </span>

          <span style={{ display: 'block', flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file ? file.name : 'Choose file'}
            </span>
            <span style={{ display: 'block', marginTop: 4, fontSize: 12.5, color: '#8b95a5' }}>
              {file ? 'Click to choose a different file' : 'Excel, CSV or PDF'}
            </span>
          </span>

          <span style={{
            flex: '0 0 auto',
            background: NAVY,
            color: '#fff',
            borderRadius: 9,
            padding: '9px 13px',
            fontSize: 12.5,
            fontWeight: 700,
          }}>
            Browse
          </span>
        </button>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginTop: 18,
          color: '#8a94a3',
          fontSize: 12.5,
        }}>
          <span>No file?</span>
          <button
            type="button"
            onClick={() => setManualMode(true)}
            style={{
              border: 0,
              background: 'transparent',
              color: NAVY,
              fontSize: 12.5,
              fontWeight: 650,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Start manually
          </button>
        </div>
      </section>
    </main>
  );
}
