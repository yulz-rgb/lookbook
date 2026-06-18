'use client';

import { Plus, Trash2 } from 'lucide-react';
import { money } from '../lib/calc';
import { ProductAttribution } from './ProductAttribution';
import { ProductPhoto } from './ProductPhoto';

export function ProductListRow({ product, isSelected, onToggle, onEdit, roleMatch, readOnly = false }) {
  return (
    <article className={`product-list-row ${isSelected ? 'selected' : ''} ${roleMatch === false ? 'role-mismatch' : ''}`}>
      <div className="plr-thumb" style={{ background: product.swatch || '#eef4f9' }}>
        {product.imageUrl ? (
          <ProductPhoto src={product.imageUrl} alt="" className="plr-thumb-img" />
        ) : (
          <div className="product-photo-shirt" style={{ background: product.swatch, borderColor: product.accent, transform: 'scale(0.55)' }} />
        )}
      </div>
      <div className="plr-main">
        <ProductAttribution product={product} compact />
        <h3>{product.name}</h3>
        <div className="plr-meta">
          <span>{product.fabric?.split(',')[0] || '—'}</span>
          <span>Lead: {product.leadTime || 'TBC'}</span>
          <span>MOQ: {product.minOrder || 1}</span>
          {roleMatch === false && <span className="plr-warn">Role mismatch</span>}
        </div>
      </div>
      <div className="plr-price">{money(product.price, product.currency)}</div>
      {readOnly ? (
        <div className="plr-actions">
          <span className={`card-status ${isSelected ? 'in' : ''}`}>{isSelected ? '✓ In look' : '—'}</span>
        </div>
      ) : (
        <div className="plr-actions">
          <button type="button" className={`card-btn ${isSelected ? 'danger' : 'primary'}`} onClick={() => onToggle(product)}>
            {isSelected ? <><Trash2 size={12} /> Remove</> : <><Plus size={12} /> Add</>}
          </button>
          <button type="button" className="card-btn" onClick={() => onEdit(product)}>Edit</button>
        </div>
      )}
    </article>
  );
}
