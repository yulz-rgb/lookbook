'use client';

import { useRef, useState } from 'react';
import { FileSpreadsheet, Pencil, Upload, X } from 'lucide-react';
import Workspace from './Workspace';

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

  if (manualMode) {
    return <Workspace mode="local" canUpload={false} isDemo />;
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f7f8fa',
      color: '#14213d',
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '72px 24px',
    }}>
      <section style={{ width: '100%', maxWidth: 680 }}>
        <div style={{ marginBottom: 46 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7b8798', marginBottom: 14 }}>
            YachtUniform
          </div>

          {!editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 'clamp(30px,5vw,44px)', lineHeight: 1.05, letterSpacing: '-.035em', fontWeight: 800 }}>
                {vesselName}
              </h1>
              <button
                type="button"
                onClick={() => { setDraftName(vesselName); setEditing(true); }}
                aria-label="Edit yacht name"
                style={{ border: 0, background: 'transparent', color: '#7b8798', cursor: 'pointer', padding: 7, borderRadius: 8 }}
              >
                <Pencil size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }}
                style={{
                  width: '100%',
                  fontSize: 30,
                  fontWeight: 760,
                  letterSpacing: '-.025em',
                  padding: '8px 10px',
                  border: '1px solid #cfd7e3',
                  borderRadius: 10,
                  outline: 'none',
                  background: '#fff',
                  color: '#14213d',
                }}
              />
              <button type="button" onClick={saveName} style={{ border: 0, background: '#14213d', color: '#fff', padding: '10px 14px', borderRadius: 9, fontWeight: 700, cursor: 'pointer' }}>Save</button>
              <button type="button" onClick={() => setEditing(false)} aria-label="Cancel edit" style={{ border: 0, background: 'transparent', color: '#7b8798', cursor: 'pointer', padding: 8 }}><X size={18}/></button>
            </div>
          )}

          <p style={{ margin: '10px 0 0', fontSize: 14, color: '#7b8798' }}>
            Keep the yacht confidential or add the name if you prefer.
          </p>
        </div>

        <div>
          <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-.02em', fontWeight: 760 }}>
            Import your current crew & uniform file
          </h2>
          <p style={{ margin: '9px 0 22px', color: '#667085', lineHeight: 1.55, fontSize: 15 }}>
            Upload the file you already use for your crew list, uniform inventory and sizes. YachtUniform will organise it from there.
          </p>

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
              minHeight: 180,
              border: '1.5px dashed #b9c3d1',
              borderRadius: 16,
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              color: '#14213d',
              padding: 24,
            }}
          >
            {file ? <FileSpreadsheet size={30} strokeWidth={1.7}/> : <Upload size={30} strokeWidth={1.7}/>} 
            <span style={{ fontSize: 16, fontWeight: 760 }}>{file ? file.name : 'Choose file'}</span>
            <span style={{ fontSize: 13, color: '#8a94a3' }}>{file ? 'Click to choose a different file' : 'Excel, CSV or PDF'}</span>
          </button>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              style={{ border: 0, background: 'transparent', color: '#697586', fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', padding: 6 }}
            >
              No file? Start manually
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
