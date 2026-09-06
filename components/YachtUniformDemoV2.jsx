'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle, Check, ChevronRight, ClipboardCheck, Filter, PackageCheck,
  RefreshCcw, Search, ShieldCheck, Ship, ShoppingCart, Users,
} from 'lucide-react';

const money = (value) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 2,
}).format(Number(value || 0));

const PRODUCTS = [
  { id:'polo', sku:'TJ-1405-NV', name:'Luxury Stretch Polo', brand:'Tee Jays', supplier:'UniformPro Europe', category:'Polo', role:'Interior', colour:'Navy', sizes:['XS','S','M','L','XL'], price:42, stock:true, lead:4, moq:1, rating:4.8, verified:'Today 13:42', fabric:'95% cotton / 5% elastane', performance:['Stretch','Easy care'], decoration:true },
  { id:'shirt', sku:'SF-WS22-WH', name:'Performance Service Shirt', brand:'Seidensticker', supplier:'UniformPro Europe', category:'Shirt', role:'Interior', colour:'White', sizes:['XS','S','M','L','XL'], price:58, stock:true, lead:5, moq:1, rating:4.7, verified:'Today 13:41', fabric:'Easy-care cotton blend', performance:['Breathable','Easy care'], decoration:true },
  { id:'skort', sku:'LYW-SK-11', name:'Gold Wrap Skort', brand:'Liquid Yacht Wear', supplier:'Liquid Yacht Wear', category:'Skort', role:'Interior', colour:'Navy', sizes:['32','34','36','38','40','42'], price:72, stock:true, lead:7, moq:2, rating:4.9, verified:'Today 13:38', fabric:'Technical stretch weave', performance:['Stretch','Quick dry'], decoration:false },
  { id:'shorts', sku:'SD-MS-440', name:'Technical Deck Shorts', brand:'Sea Design', supplier:'Sea Design', category:'Shorts', role:'Deck', colour:'Stone', sizes:['30','32','34','36','38','40'], price:64, stock:true, lead:6, moq:1, rating:4.7, verified:'Today 13:36', fabric:'4-way stretch technical fabric', performance:['Quick dry','Stretch','UPF'], decoration:true },
  { id:'deckpolo', sku:'SD-MP-220', name:'UV Performance Polo', brand:'Sea Design', supplier:'Sea Design', category:'Polo', role:'Deck', colour:'Navy', sizes:['S','M','L','XL','XXL'], price:46, stock:true, lead:6, moq:1, rating:4.7, verified:'Today 13:36', fabric:'Technical pique', performance:['UPF','Quick dry'], decoration:true },
  { id:'chef', sku:'CR-CJ-900', name:'Lightweight Chef Jacket', brand:'Chef Works', supplier:'Crew Apparel EU', category:'Chef', role:'Galley', colour:'White', sizes:['S','M','L','XL'], price:49, stock:true, lead:5, moq:1, rating:4.6, verified:'Today 13:30', fabric:'Cool Vent polycotton', performance:['Breathable','Easy care'], decoration:true },
  { id:'shoe', sku:'SR-NM-20', name:'Non-marking Deck Shoe', brand:'Sperry', supplier:'Marine Footwear EU', category:'Footwear', role:'All', colour:'Navy', sizes:['38','39','40','41','42','43','44','45'], price:89, stock:true, lead:3, moq:1, rating:4.8, verified:'Today 13:29', fabric:'Leather / rubber', performance:['Non-marking','Grip'], decoration:false },
  { id:'jacket', sku:'HH-CJ-01', name:'Crew Softshell Jacket', brand:'Helly Hansen', supplier:'Marine Footwear EU', category:'Outerwear', role:'All', colour:'Navy', sizes:['XS','S','M','L','XL','XXL'], price:118, stock:true, lead:8, moq:1, rating:4.9, verified:'Today 13:28', fabric:'Water-resistant softshell', performance:['Water resistant','Wind resistant'], decoration:true },
];

const INITIAL_CREW = [
  { id:'c1', name:'Emma J.', role:'Chief Stew', dept:'Interior', top:'S', bottom:'36', shoe:'38', sets:3, confirmed:true },
  { id:'c2', name:'Maya R.', role:'2nd Stew', dept:'Interior', top:'M', bottom:'38', shoe:'39', sets:3, confirmed:true },
  { id:'c3', name:'Noor A.', role:'Stewardess', dept:'Interior', top:'S', bottom:'36', shoe:'38', sets:3, confirmed:true },
  { id:'c4', name:'Leo M.', role:'Captain', dept:'Deck', top:'L', bottom:'34', shoe:'43', sets:3, confirmed:true },
  { id:'c5', name:'Tom B.', role:'Deckhand', dept:'Deck', top:'M', bottom:'32', shoe:'42', sets:3, confirmed:true },
  { id:'c6', name:'Alex P.', role:'Chef', dept:'Galley', top:'L', bottom:'34', shoe:'42', sets:2, confirmed:true },
];

const LOOKS = {
  Interior: [
    { productId:'polo', units:2, required:true },
    { productId:'shirt', units:2, required:true },
    { productId:'skort', units:2, required:true },
    { productId:'shoe', units:1, required:true },
    { productId:'jacket', units:1, required:false },
  ],
  Deck: [
    { productId:'deckpolo', units:2, required:true },
    { productId:'shorts', units:2, required:true },
    { productId:'shoe', units:1, required:true },
    { productId:'jacket', units:1, required:false },
  ],
  Galley: [
    { productId:'chef', units:2, required:true },
    { productId:'shoe', units:1, required:true },
    { productId:'jacket', units:1, required:false },
  ],
};

function cardStyle(extra={}) { return { background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, boxShadow:'0 2px 10px rgba(15,23,42,.04)', ...extra }; }
function pill(bg='#eef2ff', color='#3730a3') { return { display:'inline-flex', alignItems:'center', gap:5, padding:'4px 8px', borderRadius:999, background:bg, color, fontSize:12, fontWeight:700 }; }

export default function YachtUniformDemoV2() {
  const [crew, setCrew] = useState(INITIAL_CREW);
  const [sparePercent, setSparePercent] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [approved, setApproved] = useState(false);
  const [shipping, setShipping] = useState('');
  const [setup, setSetup] = useState('');
  const [vatMode, setVatMode] = useState('EXEMPT');

  const productById = useMemo(() => Object.fromEntries(PRODUCTS.map(p => [p.id,p])), []);

  const orderLines = useMemo(() => {
    const map = new Map();
    for (const member of crew) {
      const items = LOOKS[member.dept] || [];
      for (const item of items) {
        const p = productById[item.productId];
        if (!p) continue;
        let size = member.top;
        if (p.category === 'Skort' || p.category === 'Shorts') size = member.bottom;
        if (p.category === 'Footwear') size = member.shoe;
        const base = item.units * member.sets;
        const key = `${p.id}|${size}|${p.colour}`;
        const prev = map.get(key) || { ...p, size, baseQty:0, spareQty:0, orderQty:0, lineTotal:0, crew:[] };
        prev.baseQty += base;
        prev.crew.push(member.name);
        map.set(key, prev);
      }
    }
    const groupedByProduct = {};
    for (const line of map.values()) groupedByProduct[line.id] = (groupedByProduct[line.id] || 0) + line.baseQty;
    const spareTarget = Object.fromEntries(Object.entries(groupedByProduct).map(([id,qty]) => [id, Math.ceil(qty * sparePercent / 100)]));
    const spareAssigned = new Set();
    return [...map.values()].map(line => {
      const spareQty = spareAssigned.has(line.id) ? 0 : spareTarget[line.id] || 0;
      spareAssigned.add(line.id);
      const orderQty = line.baseQty + spareQty;
      return { ...line, spareQty, orderQty, lineTotal: orderQty * line.price, meetsMoq: orderQty >= line.moq };
    }).sort((a,b) => a.supplier.localeCompare(b.supplier) || a.name.localeCompare(b.name) || String(a.size).localeCompare(String(b.size)));
  }, [crew, productById, sparePercent]);

  const garmentTotal = orderLines.reduce((s,l) => s + l.lineTotal, 0);
  const decoratedUnits = orderLines.filter(l=>l.decoration).reduce((s,l)=>s+l.orderQty,0);
  const decorationTotal = decoratedUnits * 6.5;
  const shippingNumber = shipping === '' ? null : Number(shipping);
  const setupNumber = setup === '' ? null : Number(setup);
  const taxable = garmentTotal + decorationTotal + (shippingNumber || 0) + (setupNumber || 0);
  const vat = vatMode === 'VAT20' ? taxable * .2 : 0;
  const grandTotal = taxable + vat;
  const poTotal = orderLines.reduce((s,l)=>s+l.lineTotal,0) + decorationTotal + (shippingNumber || 0) + (setupNumber || 0) + vat;

  const issues = useMemo(() => {
    const out=[];
    crew.forEach(c=>{
      if (!c.top || !c.bottom || !c.shoe) out.push(`${c.name}: missing size`);
      if (!c.confirmed) out.push(`${c.name}: sizing not confirmed`);
    });
    orderLines.forEach(l=>{
      if (!l.price || l.price <= 0) out.push(`${l.name}: price missing`);
      if (!l.sku) out.push(`${l.name}: supplier SKU missing`);
      if (!l.supplier) out.push(`${l.name}: supplier missing`);
      if (!l.stock) out.push(`${l.name}: stock unavailable`);
      if (!l.sizes?.includes(String(l.size))) out.push(`${l.name}: size ${l.size} not in supplier range`);
      if (!l.meetsMoq) out.push(`${l.name}: below MOQ`);
      if (l.currency && l.currency !== 'EUR') out.push(`${l.name}: currency mismatch`);
    });
    if (shippingNumber === null) out.push('Shipping quote is TBC');
    if (setupNumber === null) out.push('Embroidery setup fee is TBC');
    if (Math.abs(grandTotal - poTotal) > 0.005) out.push('Proposal and PO totals do not reconcile');
    return out;
  }, [crew, orderLines, shippingNumber, setupNumber, grandTotal, poTotal]);

  const filtered = PRODUCTS.filter(p => {
    const q=search.trim().toLowerCase();
    const matchesQ=!q || `${p.name} ${p.brand} ${p.supplier} ${p.sku} ${p.category}`.toLowerCase().includes(q);
    const matchesRole=roleFilter==='All' || p.role===roleFilter || p.role==='All';
    return matchesQ && matchesRole;
  });

  const readiness = issues.length === 0;

  return (
    <main style={{ minHeight:'100vh', background:'#f7f8fb', color:'#14213d', fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <header style={{ background:'#0b1f3a', color:'#fff', padding:'20px 28px', position:'sticky', top:0, zIndex:10, boxShadow:'0 3px 16px rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth:1440, margin:'0 auto', display:'flex', justifyContent:'space-between', gap:20, alignItems:'center', flexWrap:'wrap' }}>
          <div><div style={{ fontSize:24, fontWeight:850, letterSpacing:'-.02em' }}>YachtUniform</div><div style={{ fontSize:13, opacity:.75 }}>Uniform procurement & inventory for professional yachts</div></div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={pill(readiness?'#dcfce7':'#fee2e2', readiness?'#166534':'#991b1b')}><ShieldCheck size={14}/>{readiness?'Order ready':`${issues.length} checks open`}</span>
            <span style={{ ...pill('#132e52','#dbeafe'), border:'1px solid #28486f' }}>M/Y Aurora · Summer 2026 v3</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:1440, margin:'0 auto', padding:28 }}>
        <section style={{ ...cardStyle({padding:18}), display:'grid', gridTemplateColumns:'repeat(5,minmax(140px,1fr))', gap:10, marginBottom:18 }}>
          {['1 · Crew','2 · Looks','3 · Products','4 · Procurement','5 · Approve'].map((x,i)=><div key={x} style={{ padding:'12px 14px', borderRadius:12, background:i===3?'#e8eef8':'#f8fafc', border:i===3?'1px solid #a7b8d3':'1px solid #eef2f7', fontWeight:i===3?800:650, color:i===3?'#0b1f3a':'#64748b' }}>{x}</div>)}
        </section>

        <section style={{ display:'grid', gridTemplateColumns:'1.15fr .85fr', gap:18, marginBottom:18 }}>
          <div style={cardStyle({padding:20})}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', gap:12, marginBottom:16 }}><div><h2 style={{ margin:0, fontSize:20 }}>Crew & sizing</h2><p style={{ margin:'4px 0 0', color:'#64748b', fontSize:13 }}>Persistent sizes, department pack, set quantity and sign-off.</p></div><span style={pill('#eff6ff','#1d4ed8')}><Users size={14}/>{crew.length} crew</span></div>
            <div style={{ overflowX:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}><thead><tr>{['Crew','Role','Top','Bottom','Shoe','Sets','Status'].map(h=><th key={h} style={{ textAlign:'left', padding:'9px 8px', color:'#64748b', borderBottom:'1px solid #e5e7eb' }}>{h}</th>)}</tr></thead><tbody>{crew.map((c,idx)=><tr key={c.id}><td style={{padding:'10px 8px',fontWeight:750,borderBottom:'1px solid #f1f5f9'}}>{c.name}</td><td style={{padding:8,borderBottom:'1px solid #f1f5f9'}}>{c.role}</td>{['top','bottom','shoe'].map(k=><td key={k} style={{padding:8,borderBottom:'1px solid #f1f5f9'}}><input value={c[k]} onChange={e=>setCrew(prev=>prev.map((x,j)=>j===idx?{...x,[k]:e.target.value}:x))} style={{width:54,border:'1px solid #dbe1ea',borderRadius:8,padding:'6px 7px'}}/></td>)}<td style={{padding:8,borderBottom:'1px solid #f1f5f9'}}><input type="number" min="1" value={c.sets} onChange={e=>setCrew(prev=>prev.map((x,j)=>j===idx?{...x,sets:Math.max(1,Number(e.target.value)||1)}:x))} style={{width:54,border:'1px solid #dbe1ea',borderRadius:8,padding:'6px 7px'}}/></td><td style={{padding:8,borderBottom:'1px solid #f1f5f9'}}><button onClick={()=>setCrew(prev=>prev.map((x,j)=>j===idx?{...x,confirmed:!x.confirmed}:x))} style={{border:0,background:'transparent',padding:0,cursor:'pointer'}}><span style={pill(c.confirmed?'#dcfce7':'#fef3c7',c.confirmed?'#166534':'#92400e')}>{c.confirmed?<Check size={13}/>:<AlertTriangle size={13}/>} {c.confirmed?'Confirmed':'Needs sign-off'}</span></button></td></tr>)}</tbody></table></div>
          </div>

          <div style={cardStyle({padding:20})}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><h2 style={{margin:0,fontSize:20}}>Order readiness</h2><p style={{margin:'4px 0 0',color:'#64748b',fontSize:13}}>Generation is blocked on incomplete procurement data.</p></div><ClipboardCheck size={24}/></div>
            <div style={{marginTop:16,display:'grid',gap:8}}>{issues.length===0?<div style={{padding:14,borderRadius:12,background:'#ecfdf5',color:'#166534',fontWeight:750}}>All checks passed. Proposal and purchase order reconcile exactly.</div>:issues.slice(0,8).map((x,i)=><div key={i} style={{display:'flex',gap:8,alignItems:'center',padding:'9px 10px',borderRadius:10,background:'#fff7ed',color:'#9a3412',fontSize:13}}><AlertTriangle size={14}/>{x}</div>)}</div>
            {issues.length>8&&<div style={{marginTop:8,fontSize:12,color:'#64748b'}}>+ {issues.length-8} more checks</div>}
          </div>
        </section>

        <section style={cardStyle({padding:20,marginBottom:18})}>
          <div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}><div><h2 style={{margin:0,fontSize:20}}>Recommended catalogue</h2><p style={{margin:'4px 0 0',color:'#64748b',fontSize:13}}>8 order-ready recommendations from 3,621 synced supplier products. Full catalogue stays secondary to the yacht workflow.</p></div><div style={{display:'flex',gap:8}}><div style={{position:'relative'}}><Search size={15} style={{position:'absolute',left:10,top:10,color:'#94a3b8'}}/><input placeholder="Search product, brand, SKU…" value={search} onChange={e=>setSearch(e.target.value)} style={{padding:'9px 10px 9px 32px',border:'1px solid #dbe1ea',borderRadius:10,minWidth:240}}/></div><select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{padding:'9px 10px',border:'1px solid #dbe1ea',borderRadius:10}}><option>All</option><option>Interior</option><option>Deck</option><option>Galley</option></select></div></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:12,marginTop:16}}>{filtered.map(p=><article key={p.id} style={{border:'1px solid #e5e7eb',borderRadius:14,padding:14,background:'#fff'}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><div><div style={{fontSize:11,color:'#64748b',fontWeight:750,textTransform:'uppercase'}}>{p.brand} · {p.sku}</div><div style={{fontWeight:850,marginTop:4}}>{p.name}</div></div><div style={{fontWeight:900}}>{money(p.price)}</div></div><div style={{fontSize:12,color:'#64748b',marginTop:9,lineHeight:1.5}}>{p.fabric}<br/>Sizes {p.sizes.join(' · ')}</div><div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:10}}>{p.performance.map(x=><span key={x} style={pill('#f1f5f9','#475569')}>{x}</span>)}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginTop:12,fontSize:12}}><div><b>Stock</b><br/><span style={{color:'#15803d'}}>Verified</span></div><div><b>Lead</b><br/>{p.lead} days</div><div><b>Supplier</b><br/>{p.supplier}</div><div><b>Rating</b><br/>{p.rating}/5</div></div><div style={{marginTop:10,fontSize:11,color:'#64748b'}}>Last verified {p.verified}</div></article>)}</div>
        </section>

        <section style={{display:'grid',gridTemplateColumns:'1.3fr .7fr',gap:18,alignItems:'start'}}>
          <div style={cardStyle({padding:20})}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><h2 style={{margin:0,fontSize:20}}>Supplier purchase order</h2><p style={{margin:'4px 0 0',color:'#64748b',fontSize:13}}>Size-aware lines. One canonical line model powers PO and proposal.</p></div><span style={pill('#ecfdf5','#166534')}><PackageCheck size={14}/> {orderLines.reduce((s,l)=>s+l.orderQty,0)} units</span></div>
            <div style={{overflowX:'auto',marginTop:14}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr>{['Supplier / SKU','Item','Colour','Size','Base','Spare','Order','Unit','Line'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 6px',color:'#64748b',borderBottom:'1px solid #e5e7eb'}}>{h}</th>)}</tr></thead><tbody>{orderLines.map((l,i)=><tr key={`${l.id}-${l.size}-${i}`}><td style={{padding:7,borderBottom:'1px solid #f1f5f9'}}>{l.supplier}<br/><span style={{color:'#64748b'}}>{l.sku}</span></td><td style={{padding:7,borderBottom:'1px solid #f1f5f9',fontWeight:750}}>{l.name}</td><td style={{padding:7,borderBottom:'1px solid #f1f5f9'}}>{l.colour}</td><td style={{padding:7,borderBottom:'1px solid #f1f5f9'}}>{l.size}</td><td style={{padding:7,borderBottom:'1px solid #f1f5f9'}}>{l.baseQty}</td><td style={{padding:7,borderBottom:'1px solid #f1f5f9'}}>{l.spareQty}</td><td style={{padding:7,borderBottom:'1px solid #f1f5f9',fontWeight:800}}>{l.orderQty}</td><td style={{padding:7,borderBottom:'1px solid #f1f5f9'}}>{money(l.price)}</td><td style={{padding:7,borderBottom:'1px solid #f1f5f9',fontWeight:800}}>{money(l.lineTotal)}</td></tr>)}</tbody></table></div>
          </div>

          <aside style={cardStyle({padding:20})}>
            <h2 style={{margin:0,fontSize:20}}>Proposal total</h2><div style={{display:'grid',gap:9,marginTop:16,fontSize:13}}><div style={{display:'flex',justifyContent:'space-between'}}><span>Garments</span><b>{money(garmentTotal)}</b></div><div style={{display:'flex',justifyContent:'space-between'}}><span>Decoration ({decoratedUnits} units)</span><b>{money(decorationTotal)}</b></div><label style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><span>Shipping</span><input value={shipping} onChange={e=>setShipping(e.target.value)} placeholder="TBC" type="number" min="0" style={{width:90,padding:'6px 8px',border:'1px solid #dbe1ea',borderRadius:8,textAlign:'right'}}/></label><label style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><span>Embroidery setup</span><input value={setup} onChange={e=>setSetup(e.target.value)} placeholder="TBC" type="number" min="0" style={{width:90,padding:'6px 8px',border:'1px solid #dbe1ea',borderRadius:8,textAlign:'right'}}/></label><label style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><span>VAT treatment</span><select value={vatMode} onChange={e=>setVatMode(e.target.value)} style={{padding:'6px 8px',border:'1px solid #dbe1ea',borderRadius:8}}><option value="EXEMPT">Exempt / 0%</option><option value="VAT20">VAT 20%</option></select></label><div style={{display:'flex',justifyContent:'space-between'}}><span>VAT</span><b>{money(vat)}</b></div></div>
            <div style={{borderTop:'1px solid #dbe1ea',marginTop:14,paddingTop:14,display:'flex',justifyContent:'space-between',fontSize:20,fontWeight:900}}><span>Total</span><span>{money(grandTotal)}</span></div>
            <div style={{marginTop:8,padding:10,borderRadius:10,background:Math.abs(grandTotal-poTotal)<.005?'#ecfdf5':'#fef2f2',fontSize:12,color:Math.abs(grandTotal-poTotal)<.005?'#166534':'#991b1b'}}>{Math.abs(grandTotal-poTotal)<.005?'✓ Proposal = purchase order exactly':'Totals do not reconcile — export blocked'}</div>
            <label style={{display:'flex',alignItems:'center',gap:8,marginTop:14,fontSize:12,color:'#475569'}}><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/> Captain / owner representative approved Summer 2026 v3</label>
            <button disabled={!readiness || !approved} style={{marginTop:14,width:'100%',border:0,borderRadius:11,padding:'12px 14px',fontWeight:850,cursor:readiness&&approved?'pointer':'not-allowed',background:readiness&&approved?'#0b1f3a':'#cbd5e1',color:'#fff',display:'flex',justifyContent:'center',alignItems:'center',gap:8}}><ShoppingCart size={16}/> Approve & export supplier POs</button>
            <div style={{marginTop:10,fontSize:11,lineHeight:1.5,color:'#64748b'}}>Currency: EUR only · Prices timestamped · Unknown costs show TBC, never €0 · SKU, size, stock, MOQ and reconciliation gates run before export.</div>
          </aside>
        </section>

        <section style={{...cardStyle({padding:18}),marginTop:18,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[['Crew change','New joiner inherits role pack + saved sizing','3 clicks'],['Reorder','Reorder Summer 2026 with current stock/price check','One action'],['Inventory','Issued / spare / damaged / returned ledger','Ready'],['Suppliers','Price · lead time · reliability · returns score','Compared']].map(([a,b,c])=><div key={a} style={{padding:12,borderRadius:12,background:'#f8fafc'}}><div style={{fontWeight:850}}>{a}</div><div style={{fontSize:12,color:'#64748b',marginTop:4,lineHeight:1.45}}>{b}</div><div style={{marginTop:8,fontSize:12,fontWeight:800,color:'#1d4ed8'}}>{c} <ChevronRight size={12} style={{verticalAlign:'-2px'}}/></div></div>)}
        </section>
      </div>
    </main>
  );
}
