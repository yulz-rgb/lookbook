'use client';

import { Plus, Trash2 } from 'lucide-react';
import { money } from '../lib/calc';
import { LookItemControls } from './LookItemControls';
import { ProductAttribution } from './ProductAttribution';
import { ProductPhoto } from './ProductPhoto';
import { ProductSpecs } from './ProductSpecs';

export function ProductListRow({
  product,
  isSelected,
  onToggle,
  onEdit,
  roleMatch,
  readOnly = false,
  allocation = null,
  roleOptions = [],
  customRoleIds = new Set(),
  eligibleCount = 0,
  baseQty = 0,
  orderQty = 0,
  disabled = false,
  onAllocationChange,
  onAddRole,
  onRemoveRole,
}) {
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
        <ProductSpecs product={product} />
        <div className="plr-meta">
          <span>Lead: {product.leadTime || 'TBC'}</span>
          <span>MOQ: {product.minOrder || 1}</span>
          {roleMatch === false && <span className="plr-warn">Role mismatch</span>}
        </div>
        {isSelected && allocation && onAllocationChange && (
          <LookItemControls
            item={allocation}
            roleOptions={roleOptions}
            customRoleIds={customRoleIds}
            eligibleCount={eligibleCount}
            baseQty={baseQty}
            orderQty={orderQty}
            compact
            disabled={disabled}
            onChange={onAllocationChange}
            onAddRole={onAddRole}
            onRemoveRole={onRemoveRole}
          />
        )}
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
