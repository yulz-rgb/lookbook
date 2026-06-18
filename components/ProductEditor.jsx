'use client';

import { useState } from 'react';
import { Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { categories } from '../lib/catalog';

const TEXT_FIELDS = [
  ['name', 'Name'],
  ['brand', 'Brand'],
  ['sku', 'SKU'],
  ['price', 'Price'],
  ['currency', 'Currency (EUR/USD/GBP)'],
  ['vatRate', 'VAT %'],
  ['minOrder', 'Min order qty'],
  ['colours', 'Colours, comma separated'],
  ['fabric', 'Fabric'],
  ['details', 'Details'],
  ['sizeRange', 'Size range'],
  ['leadTime', 'Lead time'],
  ['swatch', 'Main colour hex'],
  ['accent', 'Trim colour hex'],
];

const NUMERIC = new Set(['price', 'vatRate', 'minOrder']);

export function ProductEditor({ draft, setDraft, onSave, onNew, onDelete, onClose, canUpload }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setDraft({ ...draft, imageUrl: data.url });
    } catch (err) {
      setUploadError(String(err.message || err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-overlay no-print" onClick={onClose}>
      <div className="admin-panel" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <button className="close-admin" onClick={onClose}><X size={16} /></button>
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
          {TEXT_FIELDS.map(([field, label]) => (
            <div className="control-group" key={field}>
              <label>{label}</label>
              <input
                className="text-input"
                value={Array.isArray(draft[field]) ? draft[field].join(', ') : draft[field] ?? ''}
                onChange={(e) => setDraft({
                  ...draft,
                  [field]: NUMERIC.has(field)
                    ? Number(e.target.value)
                    : field === 'colours'
                      ? e.target.value.split(',').map((x) => x.trim()).filter(Boolean)
                      : e.target.value,
                })}
              />
            </div>
          ))}
          <div className="control-group">
            <label>Visual shape</label>
            <select className="select" value={draft.imageHint || 'polo'} onChange={(e) => setDraft({ ...draft, imageHint: e.target.value })}>
              {['polo', 'shirt', 'dress', 'shorts', 'skort', 'trousers', 'jacket', 'shoes', 'cap', 'belt'].map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="control-group">
            <label>Status</label>
            <select className="select" value={draft.active === false ? 'inactive' : 'active'} onChange={(e) => setDraft({ ...draft, active: e.target.value === 'active' })}>
              <option value="active">Active (visible)</option>
              <option value="inactive">Inactive (hidden)</option>
            </select>
          </div>
          <div className="control-group">
            <label>Product image URL</label>
            <input className="text-input" value={draft.imageUrl ?? ''} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} placeholder="https://…" />
          </div>
          <div className="control-group">
            <label>Upload image</label>
            <label className="btn ghost" style={{ cursor: canUpload ? 'pointer' : 'not-allowed', opacity: canUpload ? 1 : 0.5 }}>
              <Upload size={14} /> {uploading ? 'Uploading…' : 'Choose file'}
              <input type="file" accept="image/*" style={{ display: 'none' }} disabled={!canUpload || uploading} onChange={handleUpload} />
            </label>
            {!canUpload && <small>Blob storage not configured.</small>}
            {uploadError && <small style={{ color: 'var(--danger)' }}>{uploadError}</small>}
          </div>
          <div className="admin-actions wide">
            <button className="btn primary" onClick={onSave}><Save size={14} /> Save product</button>
            <button className="btn ghost" onClick={onNew}><Plus size={14} /> New product</button>
            {draft.id && <button className="btn danger" onClick={onDelete}><Trash2 size={14} /> Delete</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
