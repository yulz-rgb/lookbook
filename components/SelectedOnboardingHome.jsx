'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil, Upload, X } from 'lucide-react';
import Workspace from './Workspace';

const NAVY = '#0b1f3a';
const BG = 'https://images.unsplash.com/photo-1674487887038-d2fd1386def2?auto=format&fit=crop&fm=jpg&q=88&w=3000';

export default function SelectedOnboardingHome() {
  const [vesselName, setVesselName] = useState('M/Y CONFIDENTIAL');
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('M/Y CONFIDENTIAL');
  const [manualMode, setManualMode] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5200);
    return () => clearTimeout(timer);
  }, []);

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
      display: 'grid',
      placeItems: 'center',
      padding: '28px 24px',
      backgroundImage: `linear-gradient(rgba(239,246,251,.18), rgba(235,243,249,.22)), url(${BG})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: NAVY,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ position:'fixed', top:26, left:30, zIndex:2, fontFamily:'Georgia, Times New Roman, serif', fontSize:22, letterSpacing:'-.025em' }}>
        YachtUniform
      </div>
      <div style={{ position:'fixed', top:22, right:30, zIndex:2, width:36, height:36, borderRadius:'50%', display:'grid', placeItems:'center', background:'rgba(217,226,236,.82)', color:'#536984', fontSize:12, fontWeight:700 }}>
        CS
      </div>

      <section style={{
        width:'min(720px, calc(100vw - 40px))',
        borderRadius:32,
        border:'1px solid rgba(255,255,255,.82)',
        background:'rgba(246,249,252,.72)',
        backdropFilter:'blur(24px) saturate(112%)',
        WebkitBackdropFilter:'blur(24px) saturate(112%)',
        boxShadow:'0 26px 72px rgba(17,38,65,.16)',
        padding:'48px 48px 34px',
        textAlign:'center',
      }}>
        <div style={{ fontFamily:'Georgia, Times New Roman, serif', fontSize:38, opacity:.42, lineHeight:1, marginBottom:30 }}>≋</div>

        {!editing ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
            <h1 style={{ margin:0, fontFamily:'Georgia, Times New Roman, serif', fontSize:'clamp(34px, 5.5vw, 54px)', fontWeight:400, lineHeight:1.05, letterSpacing:'.008em' }}>{vesselName}</h1>
            <button type="button" onClick={() => { setDraftName(vesselName); setEditing(true); }} aria-label="Edit yacht name" style={{ border:0, background:'transparent', color:NAVY, cursor:'pointer', padding:6 }}>
              <Pencil size={18} strokeWidth={1.8}/>
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input autoFocus value={draftName} onChange={(e)=>setDraftName(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') saveName(); if(e.key==='Escape') setEditing(false); }} style={{ flex:1, minWidth:0, fontFamily:'Georgia, Times New Roman, serif', fontSize:'clamp(28px,4vw,40px)', padding:'9px 11px', border:'1px solid rgba(11,31,58,.15)', borderRadius:12, outline:'none', background:'rgba(255,255,255,.84)', color:NAVY }}/>
            <button type="button" onClick={saveName} style={{ border:0, background:NAVY, color:'#fff', borderRadius:10, padding:'11px 15px', fontWeight:700, cursor:'pointer' }}>Save</button>
            <button type="button" onClick={()=>setEditing(false)} aria-label="Cancel edit" style={{ border:0, background:'transparent', color:NAVY, cursor:'pointer', padding:7 }}><X size={18}/></button>
          </div>
        )}

        <div style={{ height:28, marginTop:7 }}>
          <p style={{ margin:0, color:'#9aa6b5', fontSize:13, opacity:showHint?1:0, transition:'opacity 1.2s ease' }}>
            Keep your yacht confidential, or add the name if you prefer.
          </p>
        </div>

        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.pdf" style={{display:'none'}}/>
        <button type="button" onClick={()=>inputRef.current?.click()} style={{
          width:'100%',
          minHeight:230,
          marginTop:18,
          border:'1px dashed rgba(11,31,58,.17)',
          borderRadius:25,
          background:'rgba(255,255,255,.62)',
          color:NAVY,
          cursor:'pointer',
          display:'flex',
          flexDirection:'column',
          alignItems:'center',
          justifyContent:'center',
          gap:16,
          padding:28,
          boxShadow:'inset 0 0 0 1px rgba(255,255,255,.28)',
        }}>
          <span style={{ width:72, height:72, borderRadius:'50%', background:'rgba(228,236,245,.9)', display:'grid', placeItems:'center' }}><Upload size={32} strokeWidth={1.5}/></span>
          <span style={{ fontFamily:'Georgia, Times New Roman, serif', fontSize:'clamp(20px,2.8vw,29px)', lineHeight:1.15 }}>Import current crew, sizes & inventory</span>
          <span style={{ fontSize:11.5, letterSpacing:'.22em', color:'#8190a4' }}>Excel · CSV · PDF</span>
        </button>

        <button type="button" onClick={()=>setManualMode(true)} style={{ marginTop:27, border:0, borderBottom:'1px solid rgba(11,31,58,.5)', background:'transparent', color:NAVY, fontSize:14, cursor:'pointer', padding:'2px 0 3px' }}>
          No file? Start manually →
        </button>
      </section>
    </main>
  );
}
