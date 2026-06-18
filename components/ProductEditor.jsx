'use client';

import { useState } from 'react';
import { ChevronDown, ImagePlus, Save, Trash2, X } from 'lucide-react';
import { categories, roles } from '../lib/catalog';
import { attachProductImage } from '../lib/productImage';

const CATEGORY_SHAPE = {
  tops: 'polo',
  shirts: 'shirt',
  epaulettes: 'epaulettes',
  dresses: 'dress',
  bottoms: 'shorts',
  'chef-wear': 'chef-jacket',
  engineering: 'overalls',
  'spa-wear': 'shirt',
  outerwear: 'jacket',
  shoes: 'shoes',
  accessories: 'cap',
};

const ADVANCED_FIELDS = [
  ['fabric', 'Fabric / material'],
  ['details', 'Notes / details'],
  ['sizeRange', 'Size range'],
  ['leadTime', 'Lead time'],
  ['minOrder', 'Minimum order qty'],
  ['vatRate', 'VAT %'],
  ['colours', 'Colours (comma separated)'],
  ['swatch', 'Main colour (hex)'],
  ['accent', 'Trim colour (hex)'],
];

const NUMERIC = new Set(['price', 'vatRate', 'minOrder']);

export function ProductEditor({
  draft,
  setDraft,
  onSave,
  onDelete,
  onClose,
  canUpload,
  isEditing,
  onOpenImport,
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function applyImageFile(file) {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const url = await attachProductImage(file, { canUpload });
      setDraft((d) => ({ ...d, imageUrl: url }));
    } catch (err) {
      setUploadError(String(err.message || err));
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e) {
    applyImageFile(e.target.files?.[0]);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    applyImageFile(e.dataTransfer.files?.[0]);
  }

  function toggleRole(roleId) {
    const current = draft.roleTags || [];
    const next = current.includes(roleId)
      ? current.filter((t) => t !== roleId)
      : [...current, roleId];
    setDraft({ ...draft, roleTags: next });
  }

  function handleCategoryChange(category) {
    setDraft({
      ...draft,
      category,
      imageHint: CATEGORY_SHAPE[category] || draft.imageHint || 'polo',
    });
  }

  function handleSave() {
    setSaveError('');
    if (!String(draft.name || '').trim()) {
      setSaveError('Give the product a name.');
      return;
    }
    onSave();
  }

  return (
    <div className="admin-overlay no-print" onClick={onClose}>
      <div className="admin-panel product-editor-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close-admin" onClick={onClose} aria-label="Close"><X size={16} /></button>
        <h2>{isEditing ? 'Edit product' : 'Add product'}</h2>
        <p className="product-editor-lead">
          {isEditing ? (
            <>Update photo, price, or category for this item.</>
          ) : (
            <>
              Adding one piece manually? Drop a photo and fill in the basics.
              {onOpenImport && (
                <> Or <button type="button" className="inline-link-btn" onClick={onOpenImport}>import a supplier PDF or website</button>.</>
              )}
            </>
          )}
        </p>

        <div className="product-editor-simple">
          <div
            className={`photo-drop-zone ${draft.imageUrl ? 'has-image' : ''} ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {draft.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.imageUrl} alt="" className="photo-drop-preview" />
                <label className="photo-drop-change">
                  Change photo
                  <input type="file" accept="image/*" hidden onChange={handleFileInput} disabled={uploading} />
                </label>
              </>
            ) : (
              <label className="photo-drop-empty">
                <ImagePlus size={32} strokeWidth={1.5} />
                <strong>{uploading ? 'Uploading…' : 'Drop photo here'}</strong>
                <span>or click to browse</span>
                <input type="file" accept="image/*" hidden onChange={handleFileInput} disabled={uploading} />
              </label>
            )}
          </div>

          <div className="product-editor-fields">
            <div className="control-group">
              <label>Name *</label>
              <input
                className="text-input"
                value={draft.name || ''}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Technical Crew Polo"
                autoFocus={!isEditing}
              />
            </div>

            <div className="product-editor-row">
              <div className="control-group">
                <label>Price</label>
                <input
                  className="text-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.price ?? ''}
                  onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="control-group">
                <label>Currency</label>
                <select className="select" value={draft.currency || 'EUR'} onChange={(e) => setDraft({ ...draft, currency: e.target.value })}>
                  <option value="EUR">EUR €</option>
                  <option value="USD">USD $</option>
                  <option value="GBP">GBP £</option>
                </select>
              </div>
            </div>

            <div className="product-editor-row">
              <div className="control-group">
                <label>Brand (manufacturer)</label>
                <input
                  className="text-input"
                  value={draft.brand || ''}
                  onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
                  placeholder="e.g. Kariban"
                />
              </div>
              <div className="control-group">
                <label>Supplier</label>
                <input
                  className="text-input"
                  value={draft.supplierName || ''}
                  onChange={(e) => setDraft({ ...draft, supplierName: e.target.value })}
                  placeholder="e.g. Marina Yacht Wear"
                />
              </div>
            </div>

            <div className="control-group">
              <label>Supplier product page</label>
              {draft.productUrl ? (
                <div className="product-url-row">
                  <input
                    className="text-input"
                    value={draft.productUrl || ''}
                    onChange={(e) => setDraft({ ...draft, productUrl: e.target.value })}
                    placeholder="https://supplier.com/products/..."
                  />
                  <a className="btn ghost" href={draft.productUrl} target="_blank" rel="noopener noreferrer">Open</a>
                </div>
              ) : (
                <input
                  className="text-input"
                  value={draft.productUrl || ''}
                  onChange={(e) => setDraft({ ...draft, productUrl: e.target.value })}
                  placeholder="https://supplier.com/products/..."
                />
              )}
            </div>

            <div className="control-group">
              <label>Category</label>
              <select className="select" value={draft.category || 'tops'} onChange={(e) => handleCategoryChange(e.target.value)}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div className="control-group">
              <label>Who wears this?</label>
              <div className="dept-chips">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`dept-chip ${(draft.roleTags || []).includes(r.id) ? 'active' : ''}`}
                    onClick={() => toggleRole(r.id)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <label>Fit</label>
              <div className="dept-chips">
                {[
                  { id: 'woman,man', label: 'Women + Men', fit: ['woman', 'man'] },
                  { id: 'woman', label: 'Women only', fit: ['woman'] },
                  { id: 'man', label: 'Men only', fit: ['man'] },
                ].map((opt) => {
                  const current = (draft.fit || ['woman', 'man']).join(',');
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`dept-chip ${current === opt.id ? 'active' : ''}`}
                      onClick={() => setDraft({ ...draft, fit: opt.fit })}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setShowAdvanced((s) => !s)}
              aria-expanded={showAdvanced}
            >
              <ChevronDown size={16} className={showAdvanced ? 'open' : ''} />
              Advanced options
              <span className="advanced-toggle-hint">brand, fabric, lead time…</span>
            </button>

            {showAdvanced && (
              <div className="product-editor-advanced">
                <div className="control-group">
                  <label>Preview shape (no photo)</label>
                  <select className="select" value={draft.imageHint || 'polo'} onChange={(e) => setDraft({ ...draft, imageHint: e.target.value })}>
                    {['polo', 'shirt', 'dress', 'shorts', 'skort', 'trousers', 'jacket', 'shoes', 'cap', 'belt', 'chef-jacket', 'overalls', 'epaulettes'].map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>
                </div>
                {ADVANCED_FIELDS.map(([field, label]) => (
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
                  <label>Status</label>
                  <select className="select" value={draft.active === false ? 'inactive' : 'active'} onChange={(e) => setDraft({ ...draft, active: e.target.value === 'active' })}>
                    <option value="active">Active (visible in catalog)</option>
                    <option value="inactive">Hidden</option>
                  </select>
                </div>
              </div>
            )}

            {uploadError && <p className="product-editor-error">{uploadError}</p>}
            {saveError && <p className="product-editor-error">{saveError}</p>}

            <div className="product-editor-actions">
              <button type="button" className="btn primary" onClick={handleSave} disabled={uploading}>
                <Save size={14} /> {isEditing ? 'Save changes' : 'Add to catalog'}
              </button>
              {isEditing && (
                <button type="button" className="btn danger" onClick={onDelete}>
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
