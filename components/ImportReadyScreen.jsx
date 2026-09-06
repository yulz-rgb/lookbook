'use client';

import { AlertTriangle, Check, Shirt } from 'lucide-react';

const NAVY = '#0b1f3a';

export default function ImportReadyScreen({ summary, onBack, onContinue }) {
  const sets = summary?.sets || [];
  return (
    <main style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      backgroundImage: 'url(/onboarding-yacht.jpg)', backgroundSize: 'cover', backgroundPosition: 'center',
      color: NAVY, fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'grid', placeItems: 'center', padding: '28px 24px'
    }}>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(244,248,252,.05),rgba(237,243,248,.1))',pointerEvents:'none'}}/>
      <div style={{position:'fixed',top:27,left:31,zIndex:2,fontFamily:'Georgia, Times New Roman, serif',fontSize:22,letterSpacing:'-.025em'}}>YachtUniform</div>
      <div style={{position:'fixed',top:23,right:31,zIndex:2,width:35,height:35,borderRadius:'50%',display:'grid',placeItems:'center',background:'rgba(213,223,234,.78)',color:'#445b77',fontSize:12,fontWeight:700}}>CS</div>

      <section style={{
        position:'relative',zIndex:1,width:'min(680px, calc(100vw - 36px))',borderRadius:28,
        border:'1px solid rgba(255,255,255,.82)',background:'rgba(248,250,253,.78)',
        backdropFilter:'blur(22px) saturate(115%)',WebkitBackdropFilter:'blur(22px) saturate(115%)',
        boxShadow:'0 24px 70px rgba(18,38,63,.18)',padding:'38px 42px 34px',textAlign:'center'
      }}>
        <div style={{fontSize:36,lineHeight:1,opacity:.5,fontFamily:'Georgia, Times New Roman, serif',marginBottom:12}}>≋</div>
        <div style={{fontSize:11,letterSpacing:'.28em',color:'#77879c',marginBottom:8}}>M/Y CONFIDENTIAL</div>
        <h1 style={{margin:'0 0 8px',fontFamily:'Georgia, Times New Roman, serif',fontSize:'clamp(34px,5vw,52px)',fontWeight:400,lineHeight:1.05}}>Import ready</h1>
        <p style={{margin:'0 auto 20px',maxWidth:450,fontSize:13,color:'#8390a3',lineHeight:1.45}}>We’ve successfully parsed your file. Review the summary below and continue to check the details.</p>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,alignItems:'start',margin:'8px 0 14px'}}>
          {['Crew','Uniform sets','Sizes','Inventory'].map((label)=>(
            <div key={label} style={{fontFamily:'Georgia, Times New Roman, serif',fontSize:13,color:NAVY}}>
              <div style={{width:32,height:32,borderRadius:'50%',margin:'0 auto 5px',display:'grid',placeItems:'center',background:NAVY,color:'#fff'}}><Check size={17}/></div>{label}
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',background:'rgba(255,255,255,.66)',border:'1px solid rgba(255,255,255,.75)',borderRadius:12,overflow:'hidden',marginBottom:16}}>
          {[
            [sets.length,'sets detected'],
            [summary?.itemCount ?? 0,'items'],
            [`~${summary?.crewCount ?? 0}`,'crew / positions'],
            [summary?.issues?.length ?? 0,'issues to review'],
          ].map(([n,l],i)=><div key={l} style={{padding:'12px 6px',borderLeft:i?'1px solid rgba(11,31,58,.08)':'none'}}><div style={{fontFamily:'Georgia, Times New Roman, serif',fontSize:24,color:i===3?'#c98322':NAVY}}>{n}</div><div style={{fontSize:10,color:'#7a8798'}}>{l}</div></div>)}
        </div>

        <div style={{textAlign:'left',fontSize:11,color:'#7c899a',marginBottom:8}}>Detected uniform sets</div>
        <div style={{display:'grid',gap:6,marginBottom:18}}>
          {sets.slice(0,5).map((set)=><div key={set.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderRadius:10,background:'rgba(255,255,255,.48)',fontSize:12}}><span style={{display:'flex',alignItems:'center',gap:9}}><span style={{width:26,height:26,borderRadius:'50%',background:'rgba(233,239,246,.92)',display:'grid',placeItems:'center'}}><Shirt size={14}/></span><span style={{fontFamily:'Georgia, Times New Roman, serif'}}>{set.name}</span></span><span style={{fontSize:10,color:'#7f8da0'}}>{set.itemCount} items</span></div>)}
        </div>

        <button onClick={onContinue} style={{width:'62%',minWidth:230,border:0,borderRadius:999,background:NAVY,color:'#fff',padding:'13px 18px',fontSize:14,cursor:'pointer'}}>Continue to review &nbsp; →</button>
        <div><button onClick={onBack} style={{marginTop:10,border:0,background:'transparent',color:'#7c8998',fontSize:11,textDecoration:'underline',cursor:'pointer'}}>Back</button></div>
        {(summary?.issues?.length ?? 0) > 0 && <div style={{marginTop:12,fontSize:10,color:'#8b96a5',display:'flex',justifyContent:'center',alignItems:'center',gap:5}}><AlertTriangle size={12}/> {summary.issues.length} checks found during import</div>}
      </section>
    </main>
  );
}
