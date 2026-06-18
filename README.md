# Yacht Crew Uniform Lookbook Template

Deployable Next.js/Vercel template for building an interactive yacht crew uniform lookbook.

## What is included

- SIM-style mannequin preview with layered garment shapes.
- Person selector: woman / man.
- Multiple looks, for example arrival, day deck, evening service.
- Editable supplier/product catalogue directly in the browser.
- Product cards with brand, SKU, price, fabric, colour, size range, lead time and details.
- Crew size / order matrix.
- Live pricing calculator with:
  - sets per crew member
  - logo / embroidery cost per item
  - spare stock percentage
  - grand total
- PDF export for owner / captain / chief stew presentation.
- CSV export for supplier ordering.
- JSON import/export backup for catalogue, looks and crew matrix.

## Deploy on Vercel

1. Upload the folder to GitHub.
2. In Vercel, choose **Add New Project**.
3. Import the repository.
4. Vercel should detect Next.js automatically.
5. Click **Deploy**.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## How to make it commercial-grade

The demo products are placeholders. Replace them with real supplier data:

- exact product photos or transparent PNG cut-outs
- supplier names
- SKUs
- wholesale prices
- VAT/shipping rules
- size availability
- colour availability
- embroidery/logo setup fees
- lead times
- minimum order quantities

## Data storage

The live editor stores changes in browser `localStorage`. This is good for a lightweight prototype.
For multi-user professional use, connect it to a database such as Supabase, Neon, Firebase or Vercel Postgres.

## Best next improvements

1. Use real transparent product PNG overlays instead of CSS garment shapes.
2. Add user login so each yacht has private saved lookbooks.
3. Add supplier API / spreadsheet sync for live stock and prices.
4. Add approval workflow: chief stew draft → captain review → boss approval.
5. Add multi-currency, VAT, shipping, logo setup and supplier minimum-order rules.
