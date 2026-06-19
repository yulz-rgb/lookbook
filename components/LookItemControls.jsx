'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Minus, Plus, X } from 'lucide-react';
import { slugifyRoleId } from '../lib/lookAllocation';

function Stepper({ label, value, min = 0, onChange, disabled = false }) {
  return (
    <div className="look-item-stepper">
      <span className="look-item-stepper-label">{label}</span>
      <div className="look-item-stepper-controls">
        <button
          type="button"
          className="look-item-stepper-btn"
          disabled={disabled || value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          <Minus size={12} />
        </button>
        <span className="look-item-stepper-value">{value}</span>
        <button
          type="button"
          className="look-item-stepper-btn"
          disabled={disabled}
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

export function LookItemControls({
  item,
  roleOptions = [],
  customRoleIds = new Set(),
  eligibleCount = 0,
  baseQty = 0,
  orderQty = 0,
  lineTotal = 0,
  fmt,
  disabled = false,
  onChange,
  onAddRole,
  onRemoveRole,
}) {
  const [open, setOpen] = useState(false);
  const [roleDraft, setRoleDraft] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selected = item.roleIds || [];
  const selectedLabels = selected
    .map((id) => roleOptions.find((r) => r.id === id)?.label || id)
    .join(', ');

  function toggleRole(roleId) {
    const next = selected.includes(roleId)
      ? selected.filter((id) => id !== roleId)
      : [...selected, roleId];
    onChange({ roleIds: next });
  }

  function submitRole() {
    const label = roleDraft.trim();
    if (!label) return;
    const id = slugifyRoleId(label);
    if (!id) return;
    onAddRole({ id, label });
    if (!selected.includes(id)) onChange({ roleIds: [...selected, id] });
    setRoleDraft('');
  }

  return (
    <div className="look-item-controls" onClick={(e) => e.stopPropagation()}>
      <Stepper
        label="Per person"
        value={item.unitsPerPerson ?? 1}
        min={1}
        disabled={disabled}
        onChange={(unitsPerPerson) => onChange({ unitsPerPerson })}
      />

      <div className="look-item-role-picker" ref={menuRef}>
        <button
          type="button"
          className="look-item-role-trigger"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="look-item-role-trigger-label">Roles</span>
          <span className="look-item-role-trigger-value">{selectedLabels || 'None selected'}</span>
          <ChevronDown size={12} className={open ? 'open' : ''} />
        </button>
        {open && (
          <div className="look-item-role-menu">
            {roleOptions.map((role) => (
              <label key={role.id} className="look-item-role-option">
                <input
                  type="checkbox"
                  checked={selected.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                />
                <span>{role.label}</span>
                {customRoleIds.has(role.id) && (
                  <button
                    type="button"
                    className="look-item-role-remove"
                    title={`Remove ${role.label}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveRole(role.id);
                    }}
                  >
                    <X size={11} />
                  </button>
                )}
              </label>
            ))}
            <div className="look-item-role-add">
              <input
                type="text"
                value={roleDraft}
                placeholder="Add role…"
                onChange={(e) => setRoleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitRole();
                  }
                }}
              />
              <button type="button" onClick={submitRole} disabled={!roleDraft.trim()}>
                <Plus size={12} />
              </button>
            </div>
          </div>
        )}
        <span className="look-item-role-meta">{eligibleCount} crew eligible</span>
      </div>

      <Stepper
        label="Spares"
        value={item.spareQty ?? 0}
        min={0}
        disabled={disabled}
        onChange={(spareQty) => onChange({ spareQty })}
      />

      <div className="look-item-quote">
        <span>{orderQty} units</span>
        <strong>{fmt(lineTotal)}</strong>
      </div>
      <div className="look-item-quote-sub">
        Base {baseQty} + spares {item.spareQty ?? 0}
      </div>
    </div>
  );
}
