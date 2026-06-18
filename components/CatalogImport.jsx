'use client';

import { useState } from 'react';
import {
  Upload, X, FileText, CheckCircle2, AlertTriangle, Link2, FileUp, Table2,
} from 'lucide-react';
import { parseCatalogCsv, CATALOG_COLUMNS, toCsv } from '../lib/csv';
import { validateCatalogRecord } from '../lib/validation';
import { ProductAttribution } from './ProductAttribution';

const METHODS = [
  { id: 'pdf', label: 'PDF catalog', icon: FileUp },
  { id: 'url', label: 'Website link', icon: Link2 },
  { id: 'csv', label: 'Spreadsheet', icon: Table2 },
];

function validateRecords(records) {
  const valid = [];
  const invalid = [];
  records.forEach((raw, idx) => {
    const result = validateCatalogRecord(raw, idx + 2);
    if (result.ok) valid.push(result);
    else invalid.push(result);
  });
  return { total: records.length, valid, invalid };
}

function validateAll(csv) {
  const { records } = parseCatalogCsv(csv || '');
  return validateRecords(records);
}

async function readApiJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 401 || text.includes('sign-in')) {
      throw new Error('Sign in required to scan catalogs — or use /demo for local mode.');
    }
    throw new Error('Server returned an unexpected response. Restart the dev server and try again.');
  }
}

export function CatalogImport({ mode, onClose, onLocalImport }) {
  const [method, setMethod] = useState('pdf');
  const [csv, setCsv] = useState('');
  const [url, setUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [brandHint, setBrandHint] = useState('');
  const [records, setRecords] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [extractMeta, setExtractMeta] = useState(null);

  function resetPreview() {
    setReport(null);
    setRecords(null);
    setResult(null);
    setError('');
    setExtractMeta(null);
  }

  function loadCsvFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsv(String(reader.result || ''));
      resetPreview();
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function loadPdfFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    resetPreview();
    e.target.value = '';
  }

  function previewCsv() {
    resetPreview();
    setReport(validateAll(csv));
    setRecords(null);
  }

  async function extractFromSource() {
    setBusy(true);
    setError('');
    setResult(null);
    setReport(null);
    setRecords(null);
    setExtractMeta(null);

    try {
      if (method === 'pdf') {
        if (!pdfFile) throw new Error('Choose a supplier PDF catalog first');
        const form = new FormData();
        form.append('file', pdfFile);
        if (brandHint.trim()) form.append('brand', brandHint.trim());
        const res = await fetch('/api/import/extract', { method: 'POST', body: form });
        const data = await readApiJson(res);
        if (!res.ok) throw new Error(data.error || 'Could not read that PDF');
        setExtractMeta({ source: 'pdf', filename: data.filename, method: data.method });
        const checked = validateRecords(data.records || []);
        setRecords(data.records || []);
        setReport(checked);
        if (checked.valid.length === 0) {
          setError('Found lines in the PDF but none passed validation. Try CSV or edit the file.');
        }
        return;
      }

      if (method === 'url') {
        const trimmed = url.trim();
        if (!trimmed) throw new Error('Paste a supplier catalog or category page URL');
        const res = await fetch('/api/import/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        });
        const data = await readApiJson(res);
        if (!res.ok) throw new Error(data.error || 'Could not scan that website');
        setExtractMeta({ source: 'url', url: trimmed, brand: data.brand, method: data.method });
        const checked = validateRecords(data.records || []);
        setRecords(data.records || []);
        setReport(checked);
        if (checked.valid.length === 0) {
          setError('Found content on the page but no valid products. Try a different page or upload the PDF.');
        }
        return;
      }

      previewCsv();
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    setBusy(true);
    setError('');
    try {
      let checked;
      if (method === 'csv') {
        checked = validateAll(csv);
      } else {
        checked = report || validateRecords(records || []);
      }

      if (checked.valid.length === 0) {
        setError('No valid products to import. Scan or validate first.');
        setReport(checked);
        return;
      }

      const shouldReplace = checked.valid.length >= 50;

      if (mode === 'server') {
        const importCsv = toCsv([
          CATALOG_COLUMNS,
          ...checked.valid.map((v) => CATALOG_COLUMNS.map((col) => {
            const val = v.value[col];
            if (Array.isArray(val)) return val.join('|');
            if (val != null && typeof val === 'object') return JSON.stringify(val);
            if (val == null) return '';
            return String(val);
          })),
        ]);
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            csv: importCsv,
            filename: 'catalog-import.csv',
            replace: shouldReplace,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Import failed');
        setResult(data);
        window.setTimeout(() => window.location.reload(), 400);
      } else {
        const products = checked.valid.map((v) => ({
          ...v.value,
          id: `product-${Math.random().toString(36).slice(2, 9)}`,
        }));
        onLocalImport(products, { replace: shouldReplace });
        setResult({ created: products.length, updated: 0, failed: checked.invalid.length });
      }
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setBusy(false);
    }
  }

  const canExtract = method === 'pdf' ? Boolean(pdfFile) : method === 'url' ? Boolean(url.trim()) : Boolean(csv.trim());
  const canImport = method === 'csv' ? Boolean(csv.trim()) : Boolean(report?.valid?.length);

  return (
    <div className="admin-overlay no-print" onClick={onClose}>
      <div className="admin-panel import-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close-admin" onClick={onClose} aria-label="Close"><X size={16} /></button>
        <h2>Import catalog</h2>
        <p className="import-lead">
          Upload a supplier PDF, paste their website link, or drop in a spreadsheet. We pull out products — you review before adding.
        </p>

        <div className="import-method-tabs" role="tablist" aria-label="Import method">
          {METHODS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={method === id}
              className={`import-method-tab ${method === id ? 'active' : ''}`}
              onClick={() => { setMethod(id); resetPreview(); }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {method === 'pdf' && (
          <div className="import-method-body">
            <label className={`import-dropzone ${pdfFile ? 'has-file' : ''}`}>
              <FileUp size={28} strokeWidth={1.5} />
              <span className="import-dropzone-title">
                {pdfFile ? pdfFile.name : 'Drop supplier PDF here or click to browse'}
              </span>
              <span className="import-dropzone-hint">Price lists, line sheets, digital catalogs — up to 20MB</span>
              <input type="file" accept="application/pdf,.pdf" hidden onChange={loadPdfFile} />
            </label>
            <div className="control-group">
              <label>Supplier name (optional)</label>
              <input
                className="text-input"
                value={brandHint}
                onChange={(e) => setBrandHint(e.target.value)}
                placeholder="e.g. Gill Marine"
              />
            </div>
          </div>
        )}

        {method === 'url' && (
          <div className="import-method-body">
            <div className="control-group">
              <label>Supplier website link</label>
              <input
                className="text-input"
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); resetPreview(); }}
                placeholder="https://supplier.com/uniforms/polos"
              />
            </div>
            <p className="import-hint">
              Paste the supplier homepage or any catalog page. Shopify stores (e.g. marinayachtwear.com) import all products with images and prices automatically.
            </p>
          </div>
        )}

        {method === 'csv' && (
          <div className="import-method-body">
            <p className="import-hint">
              Columns: <code>{CATALOG_COLUMNS.join(', ')}</code>. Lists use <code>|</code> or <code>,</code>.
            </p>
            <div className="control-group">
              <label>Paste CSV or load a file</label>
              <textarea
                className="text-area import-csv-area"
                value={csv}
                onChange={(e) => { setCsv(e.target.value); resetPreview(); }}
                placeholder={CATALOG_COLUMNS.join(',')}
              />
            </div>
            <label className="btn ghost import-file-btn">
              <Upload size={14} /> Load .csv
              <input type="file" accept=".csv,text/csv" hidden onChange={loadCsvFile} />
            </label>
          </div>
        )}

        <div className="admin-actions import-actions">
          {method === 'csv' ? (
            <button type="button" className="btn" onClick={previewCsv} disabled={!csv.trim()}>
              <FileText size={14} /> Validate / Preview
            </button>
          ) : (
            <button type="button" className="btn" onClick={extractFromSource} disabled={busy || !canExtract}>
              {busy ? 'Scanning…' : method === 'pdf' ? 'Extract from PDF' : 'Scan website'}
            </button>
          )}
          <button type="button" className="btn primary" onClick={runImport} disabled={busy || !canImport}>
            {busy ? 'Importing…' : `Add ${report?.valid?.length ? report.valid.length : ''} to catalog`.trim()}
          </button>
        </div>

        {extractMeta && (
          <p className="import-hint">
            Scanned {extractMeta.source === 'pdf' ? extractMeta.filename : extractMeta.url}
            {extractMeta.brand ? ` · ${extractMeta.brand}` : ''}
            {extractMeta.method ? ` · ${extractMeta.method}` : ''}
          </p>
        )}

        {error && <p className="import-error">{error}</p>}

        {result && (
          <div className="import-result ok">
            <CheckCircle2 size={16} /> Imported. Created {result.created}, updated {result.updated}, failed {result.failed}.
          </div>
        )}

        {report && (
          <div className="import-preview-block">
            <div className="import-summary">
              <span><CheckCircle2 size={14} /> {report.valid.length} ready</span>
              <span className={report.invalid.length ? 'bad' : ''}><AlertTriangle size={14} /> {report.invalid.length} skipped</span>
              <span>{report.total} found</span>
            </div>
            {report.valid.length > 0 && (
              <ul className="import-preview-list">
                {report.valid.slice(0, 8).map((row) => (
                  <li key={`${row.row}-${row.value.name}`}>
                    <div className="import-preview-main">
                      <strong>{row.value.name}</strong>
                      <ProductAttribution product={row.value} compact />
                    </div>
                    <span className="import-preview-price">
                      {row.value.price > 0 ? `${row.value.currency} ${row.value.price}` : 'Price TBC'}
                    </span>
                  </li>
                ))}
                {report.valid.length > 8 && (
                  <li className="import-preview-more">+ {report.valid.length - 8} more</li>
                )}
              </ul>
            )}
            {report.invalid.length > 0 && (
              <div className="import-errors">
                {report.invalid.slice(0, 10).map((row) => (
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
