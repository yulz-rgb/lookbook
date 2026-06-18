import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import {
  extractProductsFromHtml,
  enrichRecordsWithDetailPrices,
  parseProductsFromCatalogText,
  extractShopifyCatalog,
  filterUniformCatalogRecords,
  isSafeFetchUrl,
  brandFromHostname,
} from '../../../../lib/catalogExtract';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_JSON_BYTES = 6 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15000;

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'YachtUniformCatalogBot/1.0 (+https://yacht-uniform.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`Could not reach that page (${res.status})`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_HTML_BYTES) {
      throw new Error('Page is too large to scan (max 2MB of HTML)');
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(buf);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'YachtUniformCatalogBot/1.0 (+https://yacht-uniform.app)',
        Accept: 'application/json',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`Could not reach that page (${res.status})`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_JSON_BYTES) {
      throw new Error('Response is too large to scan (max 6MB JSON)');
    }
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req) {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'Upload a PDF catalog file' }, { status: 400 });
    }
    if (file.type && !file.type.includes('pdf') && !String(file.name || '').toLowerCase().endsWith('.pdf')) {
      return Response.json({ error: 'Only PDF catalogs are supported here' }, { status: 400 });
    }
    if (file.size > MAX_PDF_BYTES) {
      return Response.json({ error: 'PDF too large (max 20MB)' }, { status: 413 });
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await pdfParse(buffer);
      const text = parsed.text || '';
      if (!text.trim()) {
        return Response.json({ error: 'Could not read text from that PDF. Try a text-based catalog or use CSV.' }, { status: 422 });
      }
      const brandHint = String(form.get('brand') || '').trim();
      const records = filterUniformCatalogRecords(
        parseProductsFromCatalogText(text, { brand: brandHint, supplierName: brandHint }),
      );
      if (records.length === 0) {
        return Response.json({
          error: 'No products found in that PDF. Try a clearer price list or paste a CSV instead.',
          previewText: text.slice(0, 1200),
        }, { status: 422 });
      }
      return Response.json({
        source: 'pdf',
        filename: file.name,
        method: 'text',
        records,
        scannedChars: text.length,
      });
    } catch (err) {
      return Response.json({ error: String(err?.message || err) }, { status: 500 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const url = String(body.url || '').trim();
  if (!url) {
    return Response.json({ error: 'Provide a supplier website URL' }, { status: 400 });
  }
  if (!isSafeFetchUrl(url)) {
    return Response.json({ error: 'That URL is not allowed' }, { status: 400 });
  }

  try {
    let records = [];
    let method = 'none';
    let brand = brandFromHostname(url);

    try {
      const shopify = await extractShopifyCatalog(url, fetchJson);
      if (shopify.records.length >= 1) {
        records = shopify.records;
        method = shopify.method;
        brand = shopify.brand || brand;
      }
    } catch {
      // Not a Shopify store or products.json unavailable — fall back to HTML scraping.
    }

    if (records.length === 0) {
      const html = await fetchHtml(url);
      const extracted = extractProductsFromHtml(html, url);
      records = extracted.records;
      method = extracted.method;
      brand = extracted.brand || brand;
      if (extracted.needsPriceEnrichment && records.length) {
        records = await enrichRecordsWithDetailPrices(records, fetchHtml);
        method = 'eshop-listing+details';
      }
    }

    records = filterUniformCatalogRecords(records);

    if (records.length === 0) {
      return Response.json({
        error: 'No uniform products found on that page. Try a category or catalog page, or upload the supplier PDF.',
        brand: brand || brandFromHostname(url),
      }, { status: 422 });
    }
    return Response.json({
      source: 'url',
      url,
      method,
      brand: brand || brandFromHostname(url),
      records,
    });
  } catch (err) {
    const message = err?.name === 'AbortError'
      ? 'That site took too long to respond'
      : String(err?.message || err);
    return Response.json({ error: message }, { status: 500 });
  }
}
