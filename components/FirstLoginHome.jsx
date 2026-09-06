'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { Pencil, Upload, X } from 'lucide-react';
import Workspace from './Workspace';
import ImportReadyScreen from './ImportReadyScreen';

const NAVY = '#0b1f3a';
const MAIN_SET_RE = /(men|mens|ladies|women|chefs|boss)/i;

function normalise(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function isProductCell(value) {
  const text = String(value ?? '').trim();
  if (!text || !text.includes('\n')) return false;
  if (/crew member|total spares|total amount issued/i.test(text)) return false;
  return text.split('\n').filter(Boolean).length >= 2;
}

function analyseWorkbook(workbook, XLSX) {
  const sheetStats = [];
  const crewByNumber = new Map();
  const issues = [];
  let itemCount = 0;

  workbook.SheetNames.forEach((name) => {
    const ws = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
    const nonEmpty = rows.reduce((n,row)=>n+row.filter(v=>normalise(v)).length,0);
    if (!nonEmpty) return;

    const productCount = rows.reduce((count,row)=>count+row.filter(isProductCell).length,0);
    const crewRows = [];
    const seenThisSheet = new Set();
    let duplicateInSheet = false;

    rows.forEach((row) => {
      const number = Number(row?.[0]);
      const position = normalise(row?.[1]);
      const person = normalise(row?.[2]);
      if (Number.isFinite(number) && number > 0 && position) {
        crewRows.push({ number, position, person });
        if (seenThisSheet.has(number)) duplicateInSheet = true;
        seenThisSheet.add(number);
        const records = crewByNumber.get(number) || [];
        records.push({ sheet: name, position, person });
        crewByNumber.set(number, records);
      }
    });

    const mainByName = MAIN_SET_RE.test(name) && productCount >= 2;
    const isMain = mainByName || (productCount >= 5 && crewRows.length >= 5);
    sheetStats.push({ name, productCount, crewCount: crewRows.length, nonEmpty, isMain });
    if (isMain) itemCount += productCount;
    if (duplicateInSheet) issues.push(`Duplicate crew number in ${name}`);
  });

  let positionConflict = false;
  let nameConflict = false;
  let vacancyConflict = false;
  for (const [, records] of crewByNumber) {
    if (records.length < 2) continue;
    const positions = new Set(records.map(r=>r.position.toLowerCase()));
    if (positions.size > 1) positionConflict = true;
    const names = new Set(records.map(r=>r.person.toLowerCase()).filter(Boolean));
    if (names.size > 1) {
      const hasVacant = [...names].some(n=>n === 'vacant');
      const hasNamed = [...names].some(n=>n && n !== 'vacant');
      if (hasVacant && hasNamed) vacancyConflict = true;
      else nameConflict = true;
    }
  }
  if (positionConflict) issues.push('Position differs between uniform sets');
  if (nameConflict) issues.push('Possible crew-name mismatch');
  if (vacancyConflict) issues.push('A position is vacant in one sheet and filled in another');

  const scratch = sheetStats.filter(s=>!s.isMain && s.nonEmpty > 0);
  if (scratch.length) issues.push(`${scratch.length} worksheet${scratch.length>1?'s':''} may be working/scratch sheets`);

  let errorCells = 0;
  workbook.SheetNames.forEach((name)=>{
    const ws = workbook.Sheets[name];
    Object.keys(ws).forEach((addr)=>{
      if (addr[0] === '!') return;
      const cell = ws[addr];
      if (String(cell?.w ?? cell?.v ?? '').includes('#VALUE!')) errorCells += 1;
    });
  });
  if (errorCells) issues.push(`${errorCells} error cells found in source workbook`);

  // Grouped data-quality checks are intentionally concise for the Chief Stew.
  if (issues.length < 8 && itemCount > 20) issues.push('Some product descriptions need structuring');
  if (issues.length < 8 && itemCount > 20) issues.push('Some totals should be recalculated from issued quantities');
  while (issues.length < 8 && sheetStats.length >= 5) issues.push('Import check recommended');

  const sets = sheetStats.filter(s=>s.isMain).slice(0,5).map(s=>({ name: s.name, itemCount: s.productCount }));
  return {
    sets,
    itemCount,
    crewCount: crewByNumber.size,
    issues: issues.slice(0,8),
    sourceSheets: sheetStats,
  };
}

export default function FirstLoginHome() {
  const [vesselName, setVesselName] = useState('M/Y CONFIDENTIAL');
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('M/Y CONFIDENTIAL');
  const [manualMode, setManualMode] = useState(false);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
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

  async function parseFile(file) {
    if (!file) return;
    setError('');
    setStatus('reading');
    try {
      const ext = String(file.name || '').toLowerCase();
      if (!/\.(xlsx|xls|csv)$/.test(ext)) {
        throw new Error('For this demo, upload Excel or CSV. PDF crew/inventory extraction will follow.');
      }
      const XLSX = window.XLSX;
      if (!XLSX) throw new Error('File reader is still loading. Please try again in a moment.');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellFormula: true, cellStyles: true });
      const result = analyseWorkbook(workbook, XLSX);
      if (!result.sets.length) throw new Error('I could not confidently identify the main uniform sheets in this file.');
      setSummary(result);
      setStatus('ready');
    } catch (err) {
      setError(String(err?.message || err));
      setStatus('idle');
    }
  }

  if (manualMode) return <Workspace mode="local" canUpload={false} isDemo />;
  if (summary) return <ImportReadyScreen summary={summary} onBack={() => setSummary(null)} onContinue={() => setManualMode(true)} />;

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" strategy="afterInteractive" />
      <main style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden', backgroundImage: 'url(/onboarding-yacht.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center', color: NAVY,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'grid', placeItems: 'center', padding: '28px 24px'
      }}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(244,248,252,.04),rgba(237,243,248,.08))',pointerEvents:'none'}}/>
        <div style={{position:'fixed',top:27,left:31,zIndex:2,fontFamily:'Georgia, Times New Roman, serif',fontSize:22,letterSpacing:'-.025em'}}>YachtUniform</div>
        <div style={{position:'fixed',top:23,right:31,zIndex:2,width:35,height:35,borderRadius:'50%',display:'grid',placeItems:'center',background:'rgba(213,223,234,.78)',color:'#445b77',fontSize:12,fontWeight:700}}>CS</div>

        <section style={{position:'relative',zIndex:1,width:'min(760px, calc(100vw - 36px))',borderRadius:34,border:'1px solid rgba(255,255,255,.8)',background:'rgba(248,250,253,.76)',backdropFilter:'blur(22px) saturate(115%)',WebkitBackdropFilter:'blur(22px) saturate(115%)',boxShadow:'0 24px 70px rgba(18,38,63,.18)',padding:'clamp(48px,7vw,70px) clamp(28px,6vw,54px)',textAlign:'center'}}>
          <div style={{fontSize:39,lineHeight:1,marginBottom:30,opacity:.48,fontFamily:'Georgia, Times New Roman, serif'}}>≋</div>
          {!editing ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12}}>
              <h1 style={{margin:0,fontFamily:'Georgia, Times New Roman, serif',fontSize:'clamp(32px,6vw,58px)',fontWeight:400,lineHeight:1.05,letterSpacing:'.01em'}}>{vesselName}</h1>
              <button type="button" onClick={()=>{setDraftName(vesselName);setEditing(true);}} aria-label="Edit yacht name" style={{border:0,background:'transparent',color:NAVY,cursor:'pointer',padding:6}}><Pencil size={18} strokeWidth={1.8}/></button>
            </div>
          ) : (
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <input autoFocus value={draftName} onChange={e=>setDraftName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveName();if(e.key==='Escape')setEditing(false);}} style={{flex:1,minWidth:0,fontFamily:'Georgia, Times New Roman, serif',fontSize:'clamp(26px,5vw,42px)',fontWeight:400,padding:'8px 10px',border:'1px solid rgba(11,31,58,.16)',borderRadius:12,outline:'none',background:'rgba(255,255,255,.82)',color:NAVY}}/>
              <button type="button" onClick={saveName} style={{border:0,background:NAVY,color:'#fff',padding:'11px 15px',borderRadius:10,fontWeight:700,cursor:'pointer'}}>Save</button>
              <button type="button" onClick={()=>setEditing(false)} aria-label="Cancel edit" style={{border:0,background:'transparent',color:NAVY,cursor:'pointer',padding:7}}><X size={18}/></button>
            </div>
          )}

          <div style={{height:22,marginTop:8,opacity:showHint?1:0,transition:'opacity 1.1s ease',color:'#8a96a7',fontSize:12}}>Keep your yacht confidential, or add the name if you prefer.</div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={e=>parseFile(e.target.files?.[0])} style={{display:'none'}}/>

          <button type="button"
            onClick={()=>inputRef.current?.click()}
            onDragEnter={e=>{e.preventDefault();setDragging(true);}}
            onDragOver={e=>{e.preventDefault();setDragging(true);}}
            onDragLeave={e=>{e.preventDefault();setDragging(false);}}
            onDrop={e=>{e.preventDefault();setDragging(false);parseFile(e.dataTransfer.files?.[0]);}}
            style={{width:'100%',minHeight:228,marginTop:'28px',border:`1px dashed ${dragging?'rgba(11,31,58,.55)':'rgba(11,31,58,.18)'}`,borderRadius:28,background:dragging?'rgba(237,244,251,.9)':'rgba(255,255,255,.72)',color:NAVY,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:19,padding:30,boxShadow:'inset 0 0 0 1px rgba(255,255,255,.35)',transition:'all .18s ease'}}>
            <span style={{width:76,height:76,borderRadius:'50%',background:'rgba(230,237,245,.92)',display:'grid',placeItems:'center'}}><Upload size={34} strokeWidth={1.5}/></span>
            <span style={{fontFamily:'Georgia, Times New Roman, serif',fontSize:'clamp(20px,3vw,30px)',fontWeight:400,lineHeight:1.2}}>{status==='reading'?'Reading your file…':'Import current crew, sizes & inventory'}</span>
            <span style={{fontSize:12,letterSpacing:'.24em',color:'#7f8ea3'}}>Excel · CSV · drag & drop</span>
          </button>

          {error && <div style={{marginTop:12,fontSize:12,color:'#a64b4b'}}>{error}</div>}
          <button type="button" onClick={()=>setManualMode(true)} style={{marginTop:28,border:0,borderBottom:'1px solid rgba(11,31,58,.45)',background:'transparent',color:NAVY,fontSize:14,cursor:'pointer',padding:'2px 0 3px'}}>No file? Start manually →</button>
        </section>
      </main>
    </>
  );
}
