'use client';

import { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { parseCatalogCsv, CATALOG_COLUMNS } from '../lib/csv';
import { validateCatalogRecord } from '../lib/validation';

function validateAll(csv) {
  const { records } = parseCatalogCsv(csv || '');
  const valid = [];
  const invalid = [];
  records.forEach((raw, idx) => {
    const result = validateCatalogRecord(raw, idx + 2);
    if (result.ok) valid.push(result);
    else invalid.push(result);
  });
  return { total: records.length, valid, invalid };
}

export function CatalogImport({ mode, onClose, onLocalImport }) {
  const [csv, setCsv] = useState('');
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function loadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result || ''));
    reader.readAsText(file);
  }

  function preview() {
    setError('');
    setResult(null);
    setReport(validateAll(csv));
  }

  async function runImport() {
    setBusy(true);
    setError('');
    try {
      const checked = validateAll(csv);
      if (checked.valid.length === 0) {
        setError('No valid rows to import. Fix the errors below.');
        setReport(checked);
        return;
      }
      if (mode === 'server') {
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csv, filename: 'catalog-import.csv' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Import failed');
        setResult(data);
      } else {
        const products = checked.valid.map((v) => ({
          ...v.value,
          id: `product-${v.value.sku || Math.random().toString(36).slice(2, 9)}`,
        }));
        onLocalImport(products);
        setResult({ created: products.length, updated: 0, failed: checked.invalid.length });
      }
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-overlay no-print" onClick={onClose}>
      <div className="admin-panel" style={{ position: 'relative', maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        <button className="close-admin" onClick={onClose}><X size={16} /></button>
        <h2>Import Supplier Catalog (CSV)</h2>
        <p style={{ color: 'var(--muted)', marginTop: -8, fontSize: 13 }}>
          Required columns: <code>{CATALOG_COLUMNS.join(', ')}</code>. List fields (colours, fit, roleTags) use <code>|</code> or <code>,</code>.
        </p>
        <div className="control-group" style={{ marginBottom: 12 }}>
          <label>Paste CSV or load a file</label>
          <textarea className="text-area" style={{ minHeight: 140, fontFamily: 'monospace', fontSize: 12 }} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={CATALOG_COLUMNS.join(',')} />
        </div>
        <div className="admin-actions">
          <label className="btn ghost" style={{ cursor: 'pointer' }}>
            <Upload size={14} /> Load .csv
            <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={loadFile} />
          </label>
          <button className="btn" onClick={preview}><FileText size={14} /> Validate / Preview</button>
          <button className="btn primary" onClick={runImport} disabled={busy || !csv.trim()}>
            {busy ? 'Importing…' : `Import ${mode === 'server' ? '(to database)' : '(to workspace)'}`}
          </button>
        </div>

        {error && <p style={{ color: 'var(--danger)', fontWeight: 700 }}>{error}</p>}

        {result && (
          <div className="import-result ok">
            <CheckCircle2 size={16} /> Imported. Created {result.created}, updated {result.updated}, failed {result.failed}.
          </div>
        )}

        {report && (
          <div style={{ marginTop: 14 }}>
            <div className="import-summary">
              <span><CheckCircle2 size={14} /> {report.valid.length} valid</span>
              <span className={report.invalid.length ? 'bad' : ''}><AlertTriangle size={14} /> {report.invalid.length} invalid</span>
              <span>{report.total} total rows</span>
            </div>
            {report.invalid.length > 0 && (
              <div className="import-errors">
                {report.invalid.slice(0, 20).map((row) => (
                  <div key={row.row} className="import-error-row">
                    <strong>Row {row.row}:</strong> {row.errors.join('; ')}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
