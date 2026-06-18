#!/usr/bin/env node
/** Smoke-test /api/import/extract (URL + PDF). Run while dev server is up. */
const base = process.env.BASE_URL || 'http://localhost:3000';

async function testUrl() {
  const html = `<!doctype html><html><head>
    <script type="application/ld+json">${JSON.stringify({
      '@type': 'Product',
      name: 'Test Deck Polo',
      offers: { price: '45', priceCurrency: 'EUR' },
      brand: 'Test Supplier',
    })}</script>
  </head><body><p>Softshell Jacket €120</p></body></html>`;

  // Use a data fixture via inline mock — real fetch needs public URL.
  // Here we only verify the route responds JSON (not auth redirect).
  const res = await fetch(`${base}/api/import/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://www.example.com' }),
  });
  const body = await res.text();
  let data;
  try { data = JSON.parse(body); } catch {
    throw new Error(`URL extract did not return JSON (${res.status}): ${body.slice(0, 120)}`);
  }
  if (res.status === 307 || body.includes('sign-in')) {
    throw new Error('URL extract blocked by auth — check proxy.js public routes');
  }
  console.log('URL extract reachable:', res.status, data.error || `${data.records?.length || 0} records`);
}

async function testPdf() {
  // Minimal valid PDF with extractable text (generated for test).
  const pdf = Buffer.from(`%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 68>>stream
BT /F1 12 Tf 72 720 Td (Technical Crew Polo EUR 52.00) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000261 00000 n 
0000000378 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
456
%%EOF`);

  const form = new FormData();
  form.append('file', new Blob([pdf], { type: 'application/pdf' }), 'test-catalog.pdf');
  const res = await fetch(`${base}/api/import/extract`, { method: 'POST', body: form });
  const body = await res.text();
  let data;
  try { data = JSON.parse(body); } catch {
    throw new Error(`PDF extract did not return JSON (${res.status}): ${body.slice(0, 120)}`);
  }
  if (body.includes('sign-in')) {
    throw new Error('PDF extract blocked by auth — check proxy.js public routes');
  }
  if (!res.ok && !data.error) throw new Error(`PDF extract failed: ${body}`);
  console.log('PDF extract:', res.status, data.records?.length ? `${data.records.length} products` : data.error);
}

async function main() {
  await testUrl();
  await testPdf();
  console.log('Import extract smoke tests passed.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
