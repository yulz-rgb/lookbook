'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { categories, defaultCrew, defaultLooks, defaultProducts, bodyTypes, roles } from '../lib/catalog';
import { Download, FileDown, FileText, Plus, Save, Ship, Trash2, Upload, Wand2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const money = (value) => `€${Number(value || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
const storageKeys = { products: 'yachtUniform.products.v2', looks: 'yachtUniform.looks.v2', crew: 'yachtUniform.crew.v2' };

function useLocalData(key, fallback) {
  const [data, setData] = useState(fallback);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) setData(JSON.parse(saved));
    } catch {}
  }, [key]);
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(data)); } catch {}
  }, [key, data]);
  return [data, setData];
}

function GarmentShape({ product, bodyType }) {
  const fill = product?.swatch || '#ffffff';
  const stroke = product?.accent || '#0b1f3a';
  const hint = product?.imageHint || product?.category;
  const label = product?.name?.split(' ').slice(0, 2).join(' ');
  if (!product) return null;
  if (hint === 'dress') return <div className="garment dress" style={{ background: fill, borderColor: stroke }}><span>{label}</span></div>;
  if (hint === 'shirt') return <div className="garment shirt" style={{ background: fill, borderColor: stroke }}><span>{label}</span></div>;
  if (hint === 'jacket') return <div className="garment jacket" style={{ background: fill, borderColor: stroke }}><span>{label}</span></div>;
  if (hint === 'shorts') return <div className="garment shorts" style={{ background: fill, borderColor: stroke }}><span>{label}</span></div>;
  if (hint === 'skort') return <div className="garment skort" style={{ background: fill, borderColor: stroke }}><span>{label}</span></div>;
  if (hint === 'trousers') return <div className="garment trousers" style={{ background: fill, borderColor: stroke }}><span>{label}</span></div>;
  if (hint === 'shoes') return <><div className="garment shoe left" style={{ background: fill, borderColor: stroke }} /><div className="garment shoe right" style={{ background: fill, borderColor: stroke }} /></>;
  if (hint === 'cap') return <div className="garment cap" style={{ background: fill, borderColor: stroke }} />;
  if (hint === 'belt') return <div className="garment belt" style={{ background: fill, borderColor: stroke }} />;
  return <div className="garment polo" style={{ background: fill, borderColor: stroke }}><span>{label}</span></div>;
}

function Mannequin({ bodyType, selectedProducts, compact = false }) {
  const byCategory = Object.fromEntries(selectedProducts.map((p) => [p.category, p]));
  const accessories = selectedProducts.filter((p) => p.category === 'accessories');
  return (
    <div className={`mannequin ${bodyType} ${compact ? 'compact' : ''}`}>
      <div className="body head"><div className="hair" /></div>
      <div className="body neck" />
      <div className="body torso-base" />
      <div className="body arm left" /><div className="body arm right" />
      <div className="body leg left" /><div className="body leg right" />
      {byCategory.dresses && bodyType === 'woman' ? <GarmentShape product={byCategory.dresses} bodyType={bodyType} /> : <>
        <GarmentShape product={byCategory.tops || byCategory.shirts} bodyType={bodyType} />
        <GarmentShape product={byCategory.bottoms} bodyType={bodyType} />
      </>}
      <GarmentShape product={byCategory.outerwear} bodyType={bodyType} />
      <GarmentShape product={byCategory.shoes} bodyType={bodyType} />
      {accessories.map((p) => <GarmentShape key={p.id} product={p} bodyType={bodyType} />)}
    </div>
  );
}

function ProductCard({ product, isSelected, onToggle, onEdit }) {
  return <article className="product-card">
    <div className="product-image"><Mannequin bodyType={product.fit?.[0] || 'woman'} selectedProducts={[product]} compact /></div>
    <div className="product-body">
      <h3>{product.name}</h3>
      <div className="meta"><strong>{product.brand}</strong> · SKU {product.sku || '—'}</div>
      <div className="price">{money(product.price)}</div>
      <div className="swatches">{(product.colours || []).map(c => <span key={c}>{c}</span>)}</div>
      <div className="meta"><strong>Fabric:</strong> {product.fabric}</div>
      <div className="meta"><strong>Details:</strong> {product.details}</div>
      <div className="meta"><strong>Sizes:</strong> {product.sizeRange || 'TBC'} · <strong>Lead:</strong> {product.leadTime || 'TBC'}</div>
      <div className="actions"><button className={isSelected ? 'danger' : 'primary'} onClick={() => onToggle(product)}>{isSelected ? <Trash2 size={15}/> : <Plus size={15}/>} {isSelected ? 'Remove' : 'Add to look'}</button><button className="ghost" onClick={() => onEdit(product)}>Edit</button></div>
    </div>
  </article>;
}

function ProductEditor({ draft, setDraft, onSave, onNew, onDelete }) {
  const fields = [
    ['name', 'Name'], ['brand', 'Brand'], ['sku', 'SKU'], ['price', 'Price'], ['colours', 'Colours, comma separated'], ['fabric', 'Fabric'], ['details', 'Details'], ['sizeRange', 'Size range'], ['leadTime', 'Lead time'], ['swatch', 'Main colour hex'], ['accent', 'Trim colour hex']
  ];
  return <div className="admin-grid">
    <div className="control-group"><label>Category</label><select className="select" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
    <div className="control-group"><label>Fit</label><select className="select" value={(draft.fit || ['woman', 'man']).join(',')} onChange={e => setDraft({ ...draft, fit: e.target.value.split(',') })}><option value="woman,man">Woman + Man</option><option value="woman">Woman</option><option value="man">Man</option></select></div>
    {fields.map(([field, label]) => <div className="control-group" key={field}><label>{label}</label><input className="text-input" value={Array.isArray(draft[field]) ? draft[field].join(', ') : draft[field] ?? ''} onChange={e => setDraft({ ...draft, [field]: field === 'price' ? Number(e.target.value) : field === 'colours' ? e.target.value.split(',').map(x => x.trim()).filter(Boolean) : e.target.value })} /></div>)}
    <div className="control-group"><label>Visual shape</label><select className="select" value={draft.imageHint || 'polo'} onChange={e => setDraft({ ...draft, imageHint: e.target.value })}>{['polo','shirt','dress','shorts','skort','trousers','jacket','shoes','cap','belt'].map(x => <option key={x} value={x}>{x}</option>)}</select></div>
    <div className="actions wide"><button className="primary" onClick={onSave}><Save size={15}/> Save product</button><button className="ghost" onClick={onNew}><Plus size={15}/> New product</button>{draft.id && <button className="danger" onClick={onDelete}><Trash2 size={15}/> Delete</button>}</div>
  </div>;
}

export default function Page() {
  const [products, setProducts] = useLocalData(storageKeys.products, defaultProducts);
  const [looks, setLooks] = useLocalData(storageKeys.looks, defaultLooks);
  const [crew, setCrew] = useLocalData(storageKeys.crew, defaultCrew);
  const [activeLookId, setActiveLookId] = useState(defaultLooks[0].id);
  const [activeCategory, setActiveCategory] = useState('tops');
  const [logoCost, setLogoCost] = useState(8);
  const [sparePercent, setSparePercent] = useState(15);
  const [setsPerCrew, setSetsPerCrew] = useState(2);
  const [projectName, setProjectName] = useState('MY Yacht Uniform Lookbook');
  const [priceNote, setPriceNote] = useState('Demo prices only — replace with current supplier quotes before ordering.');
  const [editProduct, setEditProduct] = useState({ ...defaultProducts[0] });
  const pdfRef = useRef(null);

  const activeLook = looks.find(l => l.id === activeLookId) || looks[0];
  const selectedProducts = useMemo(() => products.filter(p => activeLook?.productIds?.includes(p.id)), [products, activeLook]);
  const filteredProducts = useMemo(() => products.filter(p => p.category === activeCategory && (p.fit || []).includes(activeLook?.bodyType || 'woman')), [products, activeCategory, activeLook]);
  const allLookTotals = useMemo(() => looks.map(look => ({ ...look, products: products.filter(p => look.productIds.includes(p.id)), subtotal: products.filter(p => look.productIds.includes(p.id)).reduce((s,p) => s + Number(p.price || 0), 0) })), [looks, products]);

  const assignedRows = crew.map(member => {
    const look = allLookTotals.find(l => l.id === member.assignedLook) || allLookTotals[0];
    const itemCount = look?.products?.length || 0;
    const perSet = (look?.subtotal || 0) + itemCount * Number(logoCost || 0);
    const total = perSet * Number(setsPerCrew || 1);
    return { ...member, lookName: look?.name || 'Unassigned', itemCount, perSet, total };
  });
  const baseTotal = assignedRows.reduce((s, r) => s + r.total, 0);
  const spareTotal = baseTotal * (Number(sparePercent || 0) / 100);
  const grandTotal = baseTotal + spareTotal;

  function patchActiveLook(patch) { setLooks(looks.map(l => l.id === activeLook.id ? { ...l, ...patch } : l)); }
  function toggleProduct(product) {
    const exclusive = ['tops', 'shirts', 'bottoms', 'dresses', 'outerwear', 'shoes'];
    let nextIds = activeLook.productIds || [];
    if (nextIds.includes(product.id)) nextIds = nextIds.filter(id => id !== product.id);
    else {
      const clearCategories = product.category === 'dresses' ? ['tops','shirts','bottoms','dresses'] : product.category === 'tops' || product.category === 'shirts' ? ['tops','shirts','dresses'] : product.category === 'bottoms' ? ['bottoms','dresses'] : [product.category];
      nextIds = exclusive.includes(product.category) ? nextIds.filter(id => !clearCategories.includes(products.find(p => p.id === id)?.category)) : nextIds;
      nextIds = [...nextIds, product.id];
    }
    patchActiveLook({ productIds: nextIds });
  }
  function saveProduct() {
    const normalised = { ...editProduct, id: editProduct.id || uid('product'), price: Number(editProduct.price || 0), fit: editProduct.fit?.length ? editProduct.fit : ['woman', 'man'] };
    setProducts(products.some(p => p.id === normalised.id) ? products.map(p => p.id === normalised.id ? normalised : p) : [...products, normalised]);
    setEditProduct(normalised);
  }
  function deleteProduct() {
    if (!editProduct.id) return;
    setProducts(products.filter(p => p.id !== editProduct.id));
    setLooks(looks.map(l => ({ ...l, productIds: l.productIds.filter(id => id !== editProduct.id) })));
    setEditProduct({ ...defaultProducts[0], id: uid('product'), name: 'New product' });
  }
  function addLook() {
    const newLook = { id: uid('look'), name: 'New Look', description: 'Describe when this look is used.', bodyType: 'woman', productIds: [] };
    setLooks([...looks, newLook]); setActiveLookId(newLook.id);
  }
  function deleteLook() {
    if (looks.length <= 1) return;
    const remaining = looks.filter(l => l.id !== activeLook.id); setLooks(remaining); setActiveLookId(remaining[0].id);
  }
  function addCrewRow() { setCrew([...crew, { id: uid('crew'), name: 'New Crew', role: 'interior', bodyType: 'woman', topSize: '', bottomSize: '', shoeSize: '', assignedLook: activeLook.id }]); }
  function updateCrew(id, patch) { setCrew(crew.map(c => c.id === id ? { ...c, ...patch } : c)); }
  function deleteCrew(id) { setCrew(crew.filter(c => c.id !== id)); }
  function exportCsv() {
    const rows = [['Crew Name','Role','Body','Top Size','Bottom Size','Shoe Size','Assigned Look','Sets','Per Set','Line Total']];
    assignedRows.forEach(r => rows.push([r.name, r.role, r.bodyType, r.topSize, r.bottomSize, r.shoeSize, r.lookName, setsPerCrew, r.perSet, r.total]));
    rows.push([]); rows.push(['Product SKU','Product','Brand','Category','Unit Price','Fabric','Colours','Lead Time','Size Range']);
    products.forEach(p => rows.push([p.sku, p.name, p.brand, p.category, p.price, p.fabric, (p.colours||[]).join('/'), p.leadTime, p.sizeRange]));
    const csv = rows.map(r => r.map(cell => `"${String(cell ?? '').replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-supplier-order.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify({ products, looks, crew }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'yacht-uniform-data.json'; a.click(); URL.revokeObjectURL(a.href);
  }
  function importJson(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { const data = JSON.parse(reader.result); if (data.products) setProducts(data.products); if (data.looks) setLooks(data.looks); if (data.crew) setCrew(data.crew); } catch { alert('Invalid JSON file'); } };
    reader.readAsText(file);
  }
  async function downloadPdf() {
    const element = pdfRef.current;
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth; const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight; let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight); heightLeft -= pageHeight;
    while (heightLeft > 0) { position = heightLeft - imgHeight; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight); heightLeft -= pageHeight; }
    pdf.save(`${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
  }
  const resetDemo = () => { setProducts(defaultProducts); setLooks(defaultLooks); setCrew(defaultCrew); setActiveLookId(defaultLooks[0].id); };

  return <main className="app-shell">
    <section className="hero no-print">
      <div className="panel hero-main"><div className="badge"><Ship size={15}/> Yacht Uniform Builder</div><h1>Interactive Crew Uniform Lookbook</h1><p>Build yacht crew looks like a simple dressing-SIM, assign them to crew, calculate pricing, edit the supplier catalogue, export a polished owner PDF and a supplier-ready CSV order file.</p><div className="badges"><span className="badge">Layered mannequin preview</span><span className="badge">Editable product catalogue</span><span className="badge">Crew size matrix</span><span className="badge">PDF + CSV export</span></div></div>
      <div className="panel hero-side"><h2>Project settings</h2><div className="controls"><div className="control-group"><label>Lookbook title</label><input className="text-input" value={projectName} onChange={e => setProjectName(e.target.value)} /></div><div className="control-group"><label>Price note</label><input className="text-input" value={priceNote} onChange={e => setPriceNote(e.target.value)} /></div><div className="actions"><button className="primary" onClick={downloadPdf}><Download size={16}/> Download PDF</button><button className="ghost" onClick={exportCsv}><FileDown size={16}/> Supplier CSV</button><button className="ghost" onClick={exportJson}><FileText size={16}/> Backup JSON</button><label className="ghost file-label"><Upload size={16}/> Import JSON<input type="file" accept="application/json" onChange={importJson}/></label></div></div></div>
    </section>

    <section className="workspace no-print">
      <aside className="panel section"><h2>1. Looks</h2><div className="look-list">{looks.map(l => <button key={l.id} className={`look-tab ${l.id === activeLook.id ? 'active' : ''}`} onClick={() => setActiveLookId(l.id)}>{l.name}<span>{l.bodyType}</span></button>)}</div><div className="actions"><button className="primary" onClick={addLook}><Plus size={15}/> Add look</button><button className="danger" onClick={deleteLook}><Trash2 size={15}/> Delete</button></div><div className="divider"/><div className="controls"><div className="control-group"><label>Look name</label><input className="text-input" value={activeLook.name} onChange={e => patchActiveLook({ name: e.target.value })}/></div><div className="control-group"><label>Usage note</label><textarea className="text-area" value={activeLook.description} onChange={e => patchActiveLook({ description: e.target.value })}/></div><div className="control-group"><label>Person</label><div className="segmented">{bodyTypes.map(b => <button key={b.id} className={activeLook.bodyType === b.id ? 'active' : ''} onClick={() => patchActiveLook({ bodyType: b.id, productIds: activeLook.productIds.filter(id => products.find(p => p.id === id)?.fit?.includes(b.id)) })}>{b.emoji} {b.label}</button>)}</div></div></div></aside>

      <section className="panel section"><h2>2. Dress the look</h2><div className="avatar-wrap"><div className="avatar-card"><Mannequin bodyType={activeLook.bodyType} selectedProducts={selectedProducts}/></div><div><h3>{activeLook.name}</h3><p className="muted">{activeLook.description}</p><div className="selected-list">{selectedProducts.map(p => <div className="selected-row" key={p.id}><div className="row-head"><span>{p.name}</span><span>{money(p.price)}</span></div><div className="mini">{p.brand} · {p.fabric}</div></div>)}{selectedProducts.length === 0 && <div className="note">No garments selected yet. Choose a category and add products.</div>}</div></div></div><div className="divider"/><div className="category-list">{categories.map(c => <button key={c.id} className={`chip ${activeCategory === c.id ? 'active' : ''}`} onClick={() => setActiveCategory(c.id)}>{c.label}</button>)}</div><div className="product-grid">{filteredProducts.map(p => <ProductCard key={p.id} product={p} isSelected={activeLook.productIds.includes(p.id)} onToggle={toggleProduct} onEdit={setEditProduct}/>)}</div></section>

      <aside className="panel section"><h2>3. Budget</h2><div className="controls"><div className="qty-grid"><label>Sets per crew member</label><input className="number-input" type="number" min="1" value={setsPerCrew} onChange={e => setSetsPerCrew(Number(e.target.value))}/></div><div className="qty-grid"><label>Logo / embroidery per item</label><input className="number-input" type="number" value={logoCost} onChange={e => setLogoCost(e.target.value)}/></div><div className="qty-grid"><label>Spare stock allowance %</label><input className="number-input" type="number" value={sparePercent} onChange={e => setSparePercent(e.target.value)}/></div><table className="summary-table"><tbody><tr><td>Assigned crew rows</td><td>{crew.length}</td></tr><tr><td>Base total</td><td>{money(baseTotal)}</td></tr><tr><td>Spare allowance</td><td>{money(spareTotal)}</td></tr></tbody></table><div className="total-box"><span>Estimated grand total</span><strong>{money(grandTotal)}</strong></div><button className="ghost" onClick={resetDemo}><Wand2 size={15}/> Reset demo data</button><div className="note"><strong>Truth check:</strong> this is a quotation model, not a supplier checkout. Final totals depend on stock, VAT, shipping, logo setup fees and size availability.</div></div></aside>
    </section>

    <section className="panel section no-print"><h2>4. Crew size / order matrix</h2><div className="table-scroll"><table className="crew-table"><thead><tr><th>Name</th><th>Role</th><th>Body</th><th>Top</th><th>Bottom</th><th>Shoe</th><th>Assigned look</th><th>Line total</th><th></th></tr></thead><tbody>{crew.map(c => { const row = assignedRows.find(r => r.id === c.id); return <tr key={c.id}><td><input value={c.name} onChange={e => updateCrew(c.id,{name:e.target.value})}/></td><td><select value={c.role} onChange={e => updateCrew(c.id,{role:e.target.value})}>{roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></td><td><select value={c.bodyType} onChange={e => updateCrew(c.id,{bodyType:e.target.value})}>{bodyTypes.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}</select></td><td><input value={c.topSize} onChange={e => updateCrew(c.id,{topSize:e.target.value})}/></td><td><input value={c.bottomSize} onChange={e => updateCrew(c.id,{bottomSize:e.target.value})}/></td><td><input value={c.shoeSize} onChange={e => updateCrew(c.id,{shoeSize:e.target.value})}/></td><td><select value={c.assignedLook} onChange={e => updateCrew(c.id,{assignedLook:e.target.value})}>{looks.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></td><td>{money(row?.total || 0)}</td><td><button className="danger icon" onClick={() => deleteCrew(c.id)}><Trash2 size={14}/></button></td></tr> })}</tbody></table></div><button className="primary" onClick={addCrewRow}><Plus size={15}/> Add crew member</button></section>

    <section className="panel section no-print"><h2>5. Supplier catalogue editor</h2><ProductEditor draft={editProduct} setDraft={setEditProduct} onSave={saveProduct} onNew={() => setEditProduct({ id: uid('product'), category: 'tops', name: 'New product', brand: '', sku: '', price: 0, currency: '€', colours: ['White'], swatch: '#ffffff', accent: '#0b1f3a', fabric: '', details: '', fit: ['woman','man'], roleTags: [], leadTime: '', minOrder: 1, sizeRange: '', imageHint: 'polo' })} onDelete={deleteProduct}/></section>

    <section className="panel lookbook" ref={pdfRef}>
      <div className="pdf-title"><div><div className="badge dark"><Ship size={14}/> Uniform proposal</div><h2>{projectName}</h2><p>{priceNote}</p></div><div className="pdf-total"><span>Estimated project total</span><strong>{money(grandTotal)}</strong></div></div>
      <h3>Look options</h3><div className="print-grid">{allLookTotals.map(look => <article className="print-card" key={look.id}><div className="avatar-card print"><Mannequin bodyType={look.bodyType} selectedProducts={look.products}/></div><h4>{look.name}</h4><p>{look.description}</p><table className="summary-table"><tbody>{look.products.map(p => <tr key={p.id}><td>{p.name}<br/><small>{p.brand} · {p.fabric}</small></td><td>{money(p.price)}</td></tr>)}<tr><th>Garment subtotal</th><th>{money(look.subtotal)}</th></tr></tbody></table></article>)}</div>
      <h3>Crew order matrix</h3><table className="summary-table"><thead><tr><th>Name</th><th>Role</th><th>Sizes</th><th>Look</th><th>Sets</th><th>Total</th></tr></thead><tbody>{assignedRows.map(r => <tr key={r.id}><td>{r.name}</td><td>{roles.find(x => x.id === r.role)?.label || r.role}</td><td>Top {r.topSize || '—'} / Bottom {r.bottomSize || '—'} / Shoe {r.shoeSize || '—'}</td><td>{r.lookName}</td><td>{setsPerCrew}</td><td>{money(r.total)}</td></tr>)}</tbody></table>
      <h3>Budget summary</h3><table className="summary-table"><tbody><tr><td>Base uniform total</td><td>{money(baseTotal)}</td></tr><tr><td>Spare stock allowance ({sparePercent}%)</td><td>{money(spareTotal)}</td></tr><tr><th>Estimated grand total</th><th>{money(grandTotal)}</th></tr></tbody></table>
    </section>
  </main>;
}
