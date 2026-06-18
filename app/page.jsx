'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  categories, defaultCrew, defaultLooks, defaultProducts, bodyTypes, roles,
  navCategories, vessels,
} from '../lib/catalog';
import {
  Anchor, Download, FileDown, FileText, Filter, Plus, RotateCw, Save,
  Search, Settings, Ship, SlidersHorizontal, Sun, Trash2, Upload, Wand2, X, ZoomIn,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const money = (v) => `€${Number(v || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const storageKeys = { products: 'yachtUniform.products.v2', looks: 'yachtUniform.looks.v2', crew: 'yachtUniform.crew.v2' };

function useLocalData(key, fallback) {
  const [data, setData] = useState(fallback);
  useEffect(() => {
    try { const s = window.localStorage.getItem(key); if (s) setData(JSON.parse(s)); } catch {}
  }, [key]);
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(data)); } catch {}
  }, [key, data]);
  return [data, setData];
}

function GarmentShape({ product, showLabel = true }) {
  const fill = product?.swatch || '#ffffff';
  const stroke = product?.accent || '#0b1f3a';
  const hint = product?.imageHint || product?.category;
  const label = product?.name?.split(' ').slice(0, 2).join(' ');
  if (!product) return null;
  const shapes = {
    dress: <div className="garment dress" style={{ background: fill, borderColor: stroke }}>{showLabel && <span>{label}</span>}</div>,
    shirt: <div className="garment shirt" style={{ background: fill, borderColor: stroke }}>{showLabel && <span>{label}</span>}</div>,
    jacket: <div className="garment jacket" style={{ background: fill, borderColor: stroke }}>{showLabel && <span>{label}</span>}</div>,
    shorts: <div className="garment shorts" style={{ background: fill, borderColor: stroke }}>{showLabel && <span>{label}</span>}</div>,
    skort: <div className="garment skort" style={{ background: fill, borderColor: stroke }}>{showLabel && <span>{label}</span>}</div>,
    trousers: <div className="garment trousers" style={{ background: fill, borderColor: stroke }}>{showLabel && <span>{label}</span>}</div>,
    shoes: <><div className="garment shoe left" style={{ background: fill, borderColor: stroke }} /><div className="garment shoe right" style={{ background: fill, borderColor: stroke }} /></>,
    cap: <div className="garment cap" style={{ background: fill, borderColor: stroke }} />,
    belt: <div className="garment belt" style={{ background: fill, borderColor: stroke }} />,
  };
  return shapes[hint] || <div className="garment polo" style={{ background: fill, borderColor: stroke }}>{showLabel && <span>{label}</span>}</div>;
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
      {byCategory.dresses && bodyType === 'woman' ? <GarmentShape product={byCategory.dresses} showLabel={!compact} /> : <>
        <GarmentShape product={byCategory.tops || byCategory.shirts} showLabel={!compact} />
        <GarmentShape product={byCategory.bottoms} showLabel={!compact} />
      </>}
      <GarmentShape product={byCategory.outerwear} showLabel={!compact} />
      <GarmentShape product={byCategory.shoes} showLabel={!compact} />
      {accessories.map((p) => <GarmentShape key={p.id} product={p} showLabel={!compact} />)}
    </div>
  );
}

function matchesSubFilter(product, subFilter) {
  if (!subFilter || subFilter === 'All') return true;
  const hay = `${product.name} ${product.fabric} ${product.imageHint}`.toLowerCase();
  const map = {
    Polo: 'polo', Shirt: 'shirt', Linen: 'linen', Technical: 'technical', Resort: 'resort',
    Service: 'service', Shorts: 'shorts', Skort: 'skort', Trousers: 'trouser',
    Softshell: 'softshell', Jacket: 'jacket', Deck: 'deck', Cap: 'cap', Belt: 'belt',
  };
  return hay.includes((map[subFilter] || subFilter).toLowerCase());
}

function ProductCard({ product, isSelected, onToggle, onEdit }) {
  return (
    <article className={`product-card ${isSelected ? 'selected' : ''}`}>
      <div className="product-card-image">
        <span className="brand-tag">{product.brand}</span>
        <div className="product-photo">
          <div className="product-photo-shirt" style={{ background: product.swatch, borderColor: product.accent }} />
        </div>
      </div>
      <div className="product-card-body">
        <div className="brand">{product.brand}</div>
        <h3>{product.name}</h3>
        <div className="product-price">{money(product.price)}</div>
        <div className="color-swatches">
          {(product.colours || []).slice(0, 4).map((c, i) => (
            <span key={c} className="color-swatch" title={c} style={{ background: i === 0 ? product.swatch : '#e2e8f0' }} />
          ))}
        </div>
        <div className="product-specs">
          <div className="product-spec"><strong>Fabric</strong>{product.fabric?.split(',')[0]}</div>
          <div className="product-spec"><strong>Sizes</strong>{product.sizeRange || 'TBC'}</div>
          <div className="product-spec"><strong>Lead</strong>{product.leadTime || 'TBC'}</div>
          <div className="product-spec"><strong>SKU</strong>{product.sku || '—'}</div>
        </div>
        <div className="card-actions">
          <button className={`card-btn ${isSelected ? 'danger' : 'primary'}`} onClick={() => onToggle(product)}>
            {isSelected ? <><Trash2 size={12}/> Remove</> : <><Plus size={12}/> Add</>}
          </button>
          <button className="card-btn" onClick={() => onEdit(product)}>Edit</button>
        </div>
      </div>
    </article>
  );
}

function ProductEditor({ draft, setDraft, onSave, onNew, onDelete, onClose }) {
  const fields = [
    ['name', 'Name'], ['brand', 'Brand'], ['sku', 'SKU'], ['price', 'Price'],
    ['colours', 'Colours, comma separated'], ['fabric', 'Fabric'], ['details', 'Details'],
    ['sizeRange', 'Size range'], ['leadTime', 'Lead time'], ['swatch', 'Main colour hex'], ['accent', 'Trim colour hex'],
  ];
  return (
    <div className="admin-overlay no-print" onClick={onClose}>
      <div className="admin-panel" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <button className="close-admin" onClick={onClose}><X size={16}/></button>
        <h2>Manage Products</h2>
        <div className="admin-grid">
          <div className="control-group">
            <label>Category</label>
            <select className="select" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="control-group">
            <label>Fit</label>
            <select className="select" value={(draft.fit || ['woman', 'man']).join(',')} onChange={(e) => setDraft({ ...draft, fit: e.target.value.split(',') })}>
              <option value="woman,man">Woman + Man</option>
              <option value="woman">Woman</option>
              <option value="man">Man</option>
            </select>
          </div>
          {fields.map(([field, label]) => (
            <div className="control-group" key={field}>
              <label>{label}</label>
              <input className="text-input" value={Array.isArray(draft[field]) ? draft[field].join(', ') : draft[field] ?? ''}
                onChange={(e) => setDraft({ ...draft, [field]: field === 'price' ? Number(e.target.value) : field === 'colours' ? e.target.value.split(',').map((x) => x.trim()).filter(Boolean) : e.target.value })} />
            </div>
          ))}
          <div className="control-group">
            <label>Visual shape</label>
            <select className="select" value={draft.imageHint || 'polo'} onChange={(e) => setDraft({ ...draft, imageHint: e.target.value })}>
              {['polo','shirt','dress','shorts','skort','trousers','jacket','shoes','cap','belt'].map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="admin-actions wide">
            <button className="btn primary" onClick={onSave}><Save size={14}/> Save product</button>
            <button className="btn ghost" onClick={onNew}><Plus size={14}/> New product</button>
            {draft.id && <button className="btn danger" onClick={onDelete}><Trash2 size={14}/> Delete</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [products, setProducts] = useLocalData(storageKeys.products, defaultProducts);
  const [looks, setLooks] = useLocalData(storageKeys.looks, defaultLooks);
  const [crew, setCrew] = useLocalData(storageKeys.crew, defaultCrew);
  const [activeLookId, setActiveLookId] = useState(defaultLooks[0].id);
  const [activeNavCat, setActiveNavCat] = useState('tops-shirts');
  const [subFilter, setSubFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [logoCost, setLogoCost] = useState(15);
  const [sparePercent, setSparePercent] = useState(10);
  const [setsPerCrew, setSetsPerCrew] = useState(2);
  const [vessel, setVessel] = useState(vessels[0]);
  const [priceNote, setPriceNote] = useState('Demo prices only — replace with current supplier quotes before ordering.');
  const [editProduct, setEditProduct] = useState({ ...defaultProducts[0] });
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hideBg, setHideBg] = useState(false);
  const [showCrewMgmt, setShowCrewMgmt] = useState(false);
  const pdfRef = useRef(null);

  const activeLook = looks.find((l) => l.id === activeLookId) || looks[0];
  const activeNav = navCategories.find((n) => n.id === activeNavCat) || navCategories[0];
  const selectedProducts = useMemo(() => products.filter((p) => activeLook?.productIds?.includes(p.id)), [products, activeLook]);
  const filteredProducts = useMemo(() => {
    const base = products.filter((p) =>
      activeNav.categories.includes(p.category) &&
      (p.fit || []).includes(activeLook?.bodyType || 'woman') &&
      matchesSubFilter(p, subFilter) &&
      (!search || `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(search.toLowerCase()))
    );
    if (sortBy === 'price-asc') return [...base].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sortBy === 'price-desc') return [...base].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    return base;
  }, [products, activeNav, activeLook, subFilter, search, sortBy]);

  const allLookTotals = useMemo(() => looks.map((look) => ({
    ...look,
    products: products.filter((p) => look.productIds.includes(p.id)),
    subtotal: products.filter((p) => look.productIds.includes(p.id)).reduce((s, p) => s + Number(p.price || 0), 0),
  })), [looks, products]);

  const assignedRows = crew.map((member) => {
    const look = allLookTotals.find((l) => l.id === member.assignedLook) || allLookTotals[0];
    const itemCount = look?.products?.length || 0;
    const perSet = (look?.subtotal || 0) + itemCount * Number(logoCost || 0);
    const total = perSet * Number(setsPerCrew || 1);
    return { ...member, lookName: look?.name || 'Unassigned', itemCount, perSet, total };
  });
  const baseTotal = assignedRows.reduce((s, r) => s + r.total, 0);
  const itemsTotal = assignedRows.reduce((s, r) => s + ((r.perSet - Number(logoCost || 0) * r.itemCount) * Number(setsPerCrew || 1)), 0);
  const logoTotal = assignedRows.reduce((s, r) => s + (Number(logoCost || 0) * r.itemCount * Number(setsPerCrew || 1)), 0);
  const spareTotal = baseTotal * (Number(sparePercent || 0) / 100);
  const grandTotal = baseTotal + spareTotal;

  function patchActiveLook(patch) { setLooks(looks.map((l) => l.id === activeLook.id ? { ...l, ...patch } : l)); }
  function toggleProduct(product) {
    const exclusive = ['tops', 'shirts', 'bottoms', 'dresses', 'outerwear', 'shoes'];
    let nextIds = activeLook.productIds || [];
    if (nextIds.includes(product.id)) nextIds = nextIds.filter((id) => id !== product.id);
    else {
      const clearCategories = product.category === 'dresses' ? ['tops','shirts','bottoms','dresses']
        : product.category === 'tops' || product.category === 'shirts' ? ['tops','shirts','dresses']
        : product.category === 'bottoms' ? ['bottoms','dresses'] : [product.category];
      nextIds = exclusive.includes(product.category)
        ? nextIds.filter((id) => !clearCategories.includes(products.find((p) => p.id === id)?.category))
        : nextIds;
      nextIds = [...nextIds, product.id];
    }
    patchActiveLook({ productIds: nextIds });
  }
  function saveProduct() {
    const normalised = { ...editProduct, id: editProduct.id || uid('product'), price: Number(editProduct.price || 0), fit: editProduct.fit?.length ? editProduct.fit : ['woman', 'man'] };
    setProducts(products.some((p) => p.id === normalised.id) ? products.map((p) => p.id === normalised.id ? normalised : p) : [...products, normalised]);
    setEditProduct(normalised);
  }
  function deleteProduct() {
    if (!editProduct.id) return;
    setProducts(products.filter((p) => p.id !== editProduct.id));
    setLooks(looks.map((l) => ({ ...l, productIds: l.productIds.filter((id) => id !== editProduct.id) })));
    setEditProduct({ ...defaultProducts[0], id: uid('product'), name: 'New product' });
  }
  function addLook() {
    const newLook = { id: uid('look'), name: 'New Look', description: 'Describe when this look is used.', bodyType: activeLook.bodyType, productIds: [] };
    setLooks([...looks, newLook]); setActiveLookId(newLook.id);
  }
  function addCrewRow() { setCrew([...crew, { id: uid('crew'), name: 'New Crew', role: 'interior', bodyType: 'woman', topSize: '', bottomSize: '', shoeSize: '', assignedLook: activeLook.id }]); }
  function updateCrew(id, patch) { setCrew(crew.map((c) => c.id === id ? { ...c, ...patch } : c)); }
  function deleteCrew(id) { setCrew(crew.filter((c) => c.id !== id)); }
  function exportCsv() {
    const rows = [['Crew Name','Role','Body','Top Size','Bottom Size','Shoe Size','Assigned Look','Sets','Per Set','Line Total']];
    assignedRows.forEach((r) => rows.push([r.name, r.role, r.bodyType, r.topSize, r.bottomSize, r.shoeSize, r.lookName, setsPerCrew, r.perSet, r.total]));
    rows.push([]); rows.push(['Product SKU','Product','Brand','Category','Unit Price','Fabric','Colours','Lead Time','Size Range']);
    products.forEach((p) => rows.push([p.sku, p.name, p.brand, p.category, p.price, p.fabric, (p.colours||[]).join('/'), p.leadTime, p.sizeRange]));
    const csv = rows.map((r) => r.map((cell) => `"${String(cell ?? '').replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${vessel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-supplier-order.csv`; a.click(); URL.revokeObjectURL(a.href);
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
    pdf.save(`${vessel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
  }
  const resetDemo = () => { setProducts(defaultProducts); setLooks(defaultLooks); setCrew(defaultCrew); setActiveLookId(defaultLooks[0].id); };

  return (
    <main className="dashboard">
      {/* ── Top bar ── */}
      <header className="topbar no-print">
        <div className="topbar-brand">
          <div className="brand-mark"><Anchor size={16}/></div>
          <span className="brand-name">YACHT CO.</span>
        </div>
        <div className="topbar-title">Yacht Uniform Lookbook</div>
        <div className="topbar-actions">
          <select className="topbar-select" value={vessel} onChange={(e) => setVessel(e.target.value)}>
            {vessels.map((v) => <option key={v} value={v}>Lookbook: {v}</option>)}
          </select>
          <button className="topbar-btn gold" onClick={downloadPdf}><Download size={14}/> Export PDF</button>
          <button className="topbar-btn" onClick={exportCsv}><FileDown size={14}/> Export CSV</button>
          <button className="topbar-btn icon-only" onClick={() => setShowSettings((s) => !s)} title="Settings"><Settings size={16}/></button>
        </div>
      </header>

      {showSettings && (
        <div className="admin-overlay no-print" onClick={() => setShowSettings(false)}>
          <div className="admin-panel" style={{ position: 'relative', maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <button className="close-admin" onClick={() => setShowSettings(false)}><X size={16}/></button>
            <h2>Project Settings</h2>
            <div className="control-group" style={{ marginBottom: 12 }}>
              <label>Price note (shown on PDF)</label>
              <textarea className="text-area" value={priceNote} onChange={(e) => setPriceNote(e.target.value)} />
            </div>
            <div className="control-group" style={{ marginBottom: 12 }}>
              <label>Look description</label>
              <textarea className="text-area" value={activeLook.description} onChange={(e) => patchActiveLook({ description: e.target.value })} />
            </div>
            <div className="admin-actions">
              <button className="btn ghost" onClick={resetDemo}><Wand2 size={14}/> Reset demo data</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-body">
        {/* ── Left nav ── */}
        <aside className="left-nav no-print">
          <div className="nav-section">
            <div className="nav-section-title"><span className="num">1</span> Person</div>
            <div className="gender-toggle">
              {bodyTypes.map((b) => (
                <button key={b.id} className={`gender-btn ${activeLook.bodyType === b.id ? 'active' : ''}`}
                  onClick={() => patchActiveLook({ bodyType: b.id, productIds: activeLook.productIds.filter((id) => products.find((p) => p.id === id)?.fit?.includes(b.id)) })}>
                  {b.label}
                </button>
              ))}
            </div>
            <div className="body-icons">
              {bodyTypes.map((b) => (
                <button key={b.id} className={`body-icon ${activeLook.bodyType === b.id ? 'active' : ''}`}
                  onClick={() => patchActiveLook({ bodyType: b.id, productIds: activeLook.productIds.filter((id) => products.find((p) => p.id === id)?.fit?.includes(b.id)) })}>
                  {b.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="nav-section">
            <div className="nav-section-title"><span className="num">2</span> Looks</div>
            <button className="nav-add-btn" onClick={addLook}><Plus size={12}/> Add Look</button>
            {looks.map((l) => (
              <button key={l.id} className={`nav-look-btn ${l.id === activeLook.id ? 'active' : ''}`} onClick={() => setActiveLookId(l.id)}>
                {l.name}{l.id === activeLook.id && <span className="dot" />}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title"><span className="num">3</span> Categories</div>
            {navCategories.map((nc) => (
              <button key={nc.id} className={`nav-cat-btn ${activeNavCat === nc.id ? 'active' : ''}`}
                onClick={() => { setActiveNavCat(nc.id); setSubFilter('All'); }}>
                {nc.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="main-zone">
          <div className="workspace-grid">
            {/* ── Preview ── */}
            <section className="preview-panel no-print">
              <div className="preview-look-name">Current Look: {activeLook.name}</div>
              <div className={`preview-frame ${hideBg ? 'no-bg' : ''}`}>
                <div className="preview-toolbar">
                  <span className="preview-tool"><ZoomIn size={14}/></span>
                  <span className="preview-tool"><RotateCw size={14}/></span>
                  <span className="preview-tool"><Sun size={14}/></span>
                </div>
                <Mannequin bodyType={activeLook.bodyType} selectedProducts={selectedProducts} />
              </div>
              <div className="preview-actions">
                <button className="preview-action-btn" onClick={() => setHideBg((b) => !b)}>{hideBg ? 'Show Background' : 'Hide Background'}</button>
                <button className="preview-action-btn" onClick={() => patchActiveLook({ productIds: [] })}>Reset Look</button>
              </div>
            </section>

            {/* ── Catalog ── */}
            <section className="catalog-panel no-print">
              <div className="catalog-header">
                <div className="catalog-title-row">
                  <h2>{activeNav.label}</h2>
                  <div className="catalog-controls">
                    <label className="sort-label">Sort by:</label>
                    <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="newest">Newest</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                    <button className="view-btn active" title="Grid view">▦</button>
                    <button className="view-btn" title="List view">☰</button>
                  </div>
                </div>
                <div className="catalog-filters">
                  {activeNav.subFilters.map((f) => (
                    <button key={f} className={`filter-chip ${subFilter === f ? 'active' : ''}`} onClick={() => setSubFilter(f)}>{f}</button>
                  ))}
                </div>
                <div className="catalog-search-row">
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input className="search-input" style={{ paddingLeft: 32 }} placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <button className="filter-btn"><SlidersHorizontal size={14}/> Filter</button>
                </div>
              </div>
              <div className="catalog-grid-wrap">
                <div className="catalog-grid">
                  {filteredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} isSelected={activeLook.productIds.includes(p.id)}
                      onToggle={toggleProduct} onEdit={(prod) => { setEditProduct(prod); setShowAdmin(true); }} />
                  ))}
                  {filteredProducts.length === 0 && (
                    <p style={{ color: '#94a3b8', gridColumn: '1/-1', padding: 20 }}>No products match your filters.</p>
                  )}
                </div>
              </div>
            </section>

            {/* ── Right panel ── */}
            <aside className="right-panel no-print">
              <div className="panel-block">
                <h3>Budget Calculator</h3>
                <div className="budget-row"><label>Crew Members</label><span style={{ fontWeight: 800 }}>{crew.length}</span></div>
                <div className="budget-row"><label>Sets per Crew Member</label><input className="budget-input" type="number" min="1" value={setsPerCrew} onChange={(e) => setSetsPerCrew(Number(e.target.value))} /></div>
                <div className="budget-row"><label>Logo / Embroidery per item</label><input className="budget-input" type="number" value={logoCost} onChange={(e) => setLogoCost(e.target.value)} /></div>
                <div className="budget-row"><label>Spare Stock Allowance %</label><input className="budget-input" type="number" value={sparePercent} onChange={(e) => setSparePercent(e.target.value)} /></div>
                <div className="budget-divider" />
                <div className="budget-row"><label>Items Total</label><strong>{money(itemsTotal)}</strong></div>
                <div className="budget-row"><label>Logo / Embroidery Total</label><strong>{money(logoTotal)}</strong></div>
                <div className="budget-row"><label>Spare Stock ({sparePercent}%)</label><strong>{money(spareTotal)}</strong></div>
                <div className="grand-total-box"><span>Grand Total</span><strong>{money(grandTotal)}</strong></div>
              </div>

              <div className="panel-block" style={{ flex: 1 }}>
                <h3>Crew Order Matrix <span style={{ float: 'right', textTransform: 'none', letterSpacing: 0 }}>{crew.length} items</span></h3>
                <div className="crew-table-wrap">
                  <table className="crew-table">
                    <thead><tr><th>Name</th><th>Role</th><th>Sizes</th><th>Look</th><th>Sets</th><th>Total</th></tr></thead>
                    <tbody>
                      {crew.slice(0, showCrewMgmt ? crew.length : 5).map((c) => {
                        const row = assignedRows.find((r) => r.id === c.id);
                        return (
                          <tr key={c.id}>
                            <td><input value={c.name} onChange={(e) => updateCrew(c.id, { name: e.target.value })} /></td>
                            <td>
                              <select value={c.role} onChange={(e) => updateCrew(c.id, { role: e.target.value })}>
                                {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                              </select>
                            </td>
                            <td style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{c.topSize}/{c.bottomSize}/{c.shoeSize}</td>
                            <td>
                              <select value={c.assignedLook} onChange={(e) => updateCrew(c.id, { assignedLook: e.target.value })}>
                                {looks.map((l) => <option key={l.id} value={l.id}>{l.name.split('/')[0].trim()}</option>)}
                              </select>
                            </td>
                            <td>{setsPerCrew}</td>
                            <td className="total-cell">{money(row?.total || 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={exportCsv}><FileDown size={13}/> Export CSV</button>
                  <button className="panel-btn primary" onClick={() => { setShowCrewMgmt((s) => !s); if (!showCrewMgmt) addCrewRow(); }}>
                    <Plus size={13}/> {showCrewMgmt ? 'Collapse' : 'Manage Crew'}
                  </button>
                </div>
                {showCrewMgmt && (
                  <div style={{ marginTop: 10 }}>
                    {crew.map((c) => (
                      <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, marginBottom: 6 }}>
                        <input className="text-input" placeholder="Top" value={c.topSize} onChange={(e) => updateCrew(c.id, { topSize: e.target.value })} />
                        <input className="text-input" placeholder="Bottom" value={c.bottomSize} onChange={(e) => updateCrew(c.id, { bottomSize: e.target.value })} />
                        <input className="text-input" placeholder="Shoe" value={c.shoeSize} onChange={(e) => updateCrew(c.id, { shoeSize: e.target.value })} />
                        <button className="btn danger" style={{ padding: '6px 10px' }} onClick={() => deleteCrew(c.id)}><Trash2 size={13}/></button>
                      </div>
                    ))}
                    <button className="panel-btn" style={{ width: '100%', marginTop: 6 }} onClick={addCrewRow}><Plus size={13}/> Add crew member</button>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* ── Bottom zone ── */}
          <div className="bottom-zone no-print">
            <div className="bottom-panel">
              <h4>Current Look: {activeLook.name}</h4>
              <div className="current-look-scroll">
                {selectedProducts.map((p) => (
                  <div key={p.id} className="current-item">
                    <div className="current-item-img"><Mannequin bodyType={activeLook.bodyType} selectedProducts={[p]} compact /></div>
                    <div className="current-item-info">
                      <div className="name">{p.name.split(' ').slice(0, 2).join(' ')}</div>
                      <div className="price">{money(p.price)}</div>
                    </div>
                  </div>
                ))}
                <div className="add-item-slot" onClick={() => document.querySelector('.catalog-grid-wrap')?.scrollIntoView({ behavior: 'smooth' })}>+ Add Item</div>
              </div>
            </div>

            <div className="bottom-panel">
              <h4>Looks Overview</h4>
              <div className="looks-overview-scroll">
                {allLookTotals.map((look) => (
                  <div key={look.id} className={`look-thumb ${look.id === activeLook.id ? 'active' : ''}`} onClick={() => setActiveLookId(look.id)}>
                    <div className="look-thumb-card"><Mannequin bodyType={look.bodyType} selectedProducts={look.products} compact /></div>
                    <div className="look-thumb-label">{look.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bottom-panel">
              <h4>Catalogue Management</h4>
              <div className="catalogue-mgmt-btns">
                <button className="mgmt-btn" onClick={() => setShowAdmin(true)}><Filter size={15}/> Manage Products</button>
                <button className="mgmt-btn" onClick={exportJson}><FileText size={15}/> Export JSON Backup</button>
                <label className="mgmt-btn file-label"><Upload size={15}/> Import JSON<input type="file" accept="application/json" onChange={importJson}/></label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAdmin && (
        <ProductEditor draft={editProduct} setDraft={setEditProduct} onSave={saveProduct}
          onNew={() => setEditProduct({ id: uid('product'), category: 'tops', name: 'New product', brand: '', sku: '', price: 0, currency: '€', colours: ['White'], swatch: '#ffffff', accent: '#0b1f3a', fabric: '', details: '', fit: ['woman','man'], roleTags: [], leadTime: '', minOrder: 1, sizeRange: '', imageHint: 'polo' })}
          onDelete={deleteProduct} onClose={() => setShowAdmin(false)} />
      )}

      {/* ── PDF export section ── */}
      <section className="lookbook" ref={pdfRef}>
        <div className="pdf-title">
          <div>
            <div className="badge"><Ship size={14}/> Uniform proposal</div>
            <h2>{vessel} — Uniform Lookbook</h2>
            <p>{priceNote}</p>
          </div>
          <div className="pdf-total"><span>Estimated project total</span><strong>{money(grandTotal)}</strong></div>
        </div>
        <h3>Look options</h3>
        <div className="print-grid">
          {allLookTotals.map((look) => (
            <article className="print-card" key={look.id}>
              <div className="avatar-card print"><Mannequin bodyType={look.bodyType} selectedProducts={look.products} /></div>
              <h4>{look.name}</h4><p>{look.description}</p>
              <table className="summary-table"><tbody>
                {look.products.map((p) => <tr key={p.id}><td>{p.name}<br/><small>{p.brand} · {p.fabric}</small></td><td>{money(p.price)}</td></tr>)}
                <tr><th>Garment subtotal</th><th>{money(look.subtotal)}</th></tr>
              </tbody></table>
            </article>
          ))}
        </div>
        <h3>Crew order matrix</h3>
        <table className="summary-table">
          <thead><tr><th>Name</th><th>Role</th><th>Sizes</th><th>Look</th><th>Sets</th><th>Total</th></tr></thead>
          <tbody>{assignedRows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td><td>{roles.find((x) => x.id === r.role)?.label || r.role}</td>
              <td>Top {r.topSize || '—'} / Bottom {r.bottomSize || '—'} / Shoe {r.shoeSize || '—'}</td>
              <td>{r.lookName}</td><td>{setsPerCrew}</td><td>{money(r.total)}</td>
            </tr>
          ))}</tbody>
        </table>
        <h3>Budget summary</h3>
        <table className="summary-table"><tbody>
          <tr><td>Base uniform total</td><td>{money(baseTotal)}</td></tr>
          <tr><td>Spare stock allowance ({sparePercent}%)</td><td>{money(spareTotal)}</td></tr>
          <tr><th>Estimated grand total</th><th>{money(grandTotal)}</th></tr>
        </tbody></table>
      </section>
    </main>
  );
}
