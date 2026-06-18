# Yacht Uniform Lookbook Handover

## Detailed Objective
Build and continuously refine this platform so it visually and functionally matches the target reference interface: a premium yacht-uniform configurator where users can compose looks on a model, browse and filter a catalog, manage multiple look presets, calculate budget impact across crew allocations, and export operational outputs (PDF/CSV/JSON) for procurement workflows.  
The purpose of the platform is to move from a demo configurator into a production-like operational tool for yacht management teams, with emphasis on:
- clear maritime luxury visual language
- fast outfit composition and comparison
- accurate crew order planning and budget forecasting
- dependable export and handoff artifacts
- maintainable front-end structure for ongoing iteration

## CURRENT STATUS — LAUNCHED (updated 2026-06-18 17:15 UTC+2)
The full launch-readiness plan (`/Users/lana/.cursor/plans/launch_readiness_7342b80a.plan.md`) is implemented, verified, and **deployed to production**. All 9 to-dos are complete.

**Live production URL:** https://yachtuniform.vercel.app (running in full backend mode: Clerk auth + Neon Postgres + Vercel Blob). Signed-out requests to `/` correctly 307-redirect to `/sign-in`.

**Provisioned managed services (Vercel project `yulzs-projects/yachtuniform`):**
- Neon Postgres `neon-byzantium-book` (Free plan) — migration `0001_init` applied; demo yacht seeded (12 products, 4 looks, 6 crew).
- Clerk `clerk-apricot-canvas` (Free plan) — auth live; `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` set across all envs.
- Vercel Blob `yacht-uniform-blob` (public) — product image uploads.
- `prisma/schema.prisma` datasource uses `directUrl` (`DATABASE_URL_UNPOOLED`) for migrations over Neon.

**Remaining owner tasks (no code needed):**
1. Sign up the first owner account at https://yachtuniform.vercel.app/sign-up.
2. Import real supplier data via in-app "Import Catalog CSV" (template `docs/catalog-template.csv`); demo data is bootstrap-only.
3. Invite crew/captain users and run `docs/SMOKE_TEST.md`.

**Verified green:** `npm run lint`, `npm test` (17 passing), `npm run build`, production deploy READY.

**What exists now:**
- Runs in two modes automatically: Local (no env -> localStorage + demo data) and Production (env set -> Clerk auth + Neon/Postgres, per-yacht isolation).
- Prisma schema + migration (`prisma/`), tenant-scoped data layer (`lib/repository.js`), server actions (`app/actions.js`), API routes (`app/api/import`, `app/api/upload`).
- Clerk auth (`proxy.js`, `app/sign-in`, `app/sign-up`, conditional `ClerkProvider`).
- Refactored UI in `components/` (`Workspace`, `Mannequin`, `ProductCard`, `ProductEditor`, `CatalogImport`); `app/page.jsx` is a thin server loader.
- Procurement engine (`lib/calc.js`): VAT, shipping, embroidery setup, spare allowance, MOQ-aware supplier order, validation warnings. CSV in/out (`lib/csv.js`), Zod validation (`lib/validation.js`).
- Approval workflow (Draft -> Captain -> Owner -> Approved) with locked-totals snapshots.
- Tests (Vitest), CI (`.github/workflows/ci.yml`), `.env.example`, error/loading/not-found UI, Vercel Analytics, docs (`README.md`, `docs/LAUNCH.md`, `docs/SMOKE_TEST.md`, `docs/catalog-template.csv`).

**Redeploy after future changes:** `git push origin main && npx vercel --prod --yes`. To re-pull provisioned env vars locally: `vercel env pull .env.local`. Prisma CLI reads `.env` (not `.env.local`), so for local DB commands run `set -a; . ./.env.local; set +a; npx prisma migrate deploy`.

**Git state:** all launch changes are committed and pushed to `main`; production is deployed and aliased to https://yachtuniform.vercel.app.

## Deploy Workflow (required)
After every `git push` to GitHub, **always deploy to Vercel production** before considering the task done.

1. Push changes to `main` on `https://github.com/yulz-rgb/yachtuniform.git`
2. Run: `npx vercel --prod --yes` from the project root
3. Confirm deployment is **Ready** and aliased to `https://yachtuniform.vercel.app`
4. Log the deployment URL in the Action Log below

**Vercel project:** `yulzs-projects/yachtuniform` (not `yacht-uniform-lookbook-template-v2`)

Do not rely on Git auto-deploy alone — always run an explicit production deploy after pushing.

## Launch Acceptance Criteria
The platform is considered launch ready only when all of the following are true:
1. Authenticated access: end users sign in (Clerk) and only ever see yachts they belong to.
2. Real catalog data: products come from the database (imported supplier data), not hardcoded demo arrays.
3. Per-yacht persistence: products, looks, crew, and project settings survive refresh and are isolated per yacht.
4. Procurement-grade outputs: budget includes VAT, shipping, embroidery, spare allowance and MOQ warnings; CSV is supplier-orderable.
5. Approval workflow: a lookbook/order can move draft -> captain review -> owner approval -> approved, with traceable totals.
6. Verified build + tests: `npm run build` and `npm test` pass; CI runs them on every push.
7. Production deploy: pushed to `main`, deployed via `npx vercel --prod --yes`, Ready at `https://yachtuniform.vercel.app`, logged below.

## Runtime Modes
- Local mode (no env): runs on browser localStorage with demo catalog. Good for design/dev only.
- Production mode: set `DATABASE_URL` (Neon), Clerk keys, and `BLOB_READ_WRITE_TOKEN`, then run `prisma migrate deploy` + `npm run db:seed`. The app automatically switches to authenticated, database-backed, multi-tenant operation.

## Required Environment Variables
See `.env.example`. Provision via Vercel Marketplace (`vercel integration add neon`, `vercel integration add clerk`) so vars are auto-injected, then `vercel env pull .env.local`.

## Action Log
- 2026-06-18 15:23 (UTC+2): Initialized handover file with objective and tracking log.
- 2026-06-18 15:24 (UTC+2): Audited `app/page.jsx`, `app/globals.css`, `app/layout.jsx`, and `lib/catalog.js` to map current architecture and identify visual/interaction gaps vs target PNG.
- 2026-06-18 15:29 (UTC+2): Updated `app/page.jsx` to improve target parity: added product sort control, refined catalog header controls, switched product card thumbnail to cleaner product-style visual, improved compact mannequin label behavior, and expanded budget breakdown rows.
- 2026-06-18 15:31 (UTC+2): Updated `app/globals.css` to style the new catalog controls and product visual treatment, widened preview area, adjusted preview background aesthetic, and added budget divider styling.
- 2026-06-18 15:31 (UTC+2): Ran `npm run build` to validate compilation and static generation; build passed successfully.
- 2026-06-18 15:31 (UTC+2): Checked git working tree (`app/page.jsx`, `app/globals.css`, and `handover.md` modified/added as expected).
- 2026-06-18 15:32 (UTC+2): Updated `lib/catalog.js` body type labels from Woman/Man to Female/Male to better match the reference UI language.
- 2026-06-18 15:32 (UTC+2): Re-ran `npm run build` after catalog label update; build passed successfully.
- 2026-06-18 15:36 (UTC+2): Comprehensive visual & UX redesign pass. `app/globals.css` fully rewritten with premium maritime design system; `app/page.jsx` targeted improvements (NAV_ICONS, look prices in sidebar, result count badge, preview stats, budget results panel, empty state). Build passed.
- 2026-06-18 15:52 (UTC+2): Added required deploy workflow to handover (always `npx vercel --prod --yes` after every GitHub push). Ran explicit production deploy `dpl_2WGniqBS1LM1k72cFdKzuxXDBtbG` → https://yachtuniform.vercel.app (Ready).
- 2026-06-18 16:10 (UTC+2): Began launch-readiness execution. Pinned dependencies to stable versions, removed unused `@react-pdf/renderer`, added Prisma/Clerk/Blob/Zod/Vitest, switched package to ESM, and added launch acceptance criteria + runtime modes to handover.
- 2026-06-18 16:20 (UTC+2): Added Prisma schema + initial migration + demo seed, and backend libraries (`lib/config`, `lib/db`, `lib/calc`, `lib/csv`, `lib/validation`, `lib/auth`, `lib/blob`, `lib/repository`). Build passed.
- 2026-06-18 16:45 (UTC+2): Added Clerk auth (`proxy.js`, sign-in/up routes, conditional `ClerkProvider`), tenant-scoped server actions + API routes (`/api/import`, `/api/upload`), and graceful local/production runtime modes.
- 2026-06-18 16:50 (UTC+2): Refactored monolithic page into `components/` (`Workspace`, `Mannequin`, `ProductCard`, `ProductEditor`, `CatalogImport`); `app/page.jsx` now a thin server loader. UI/UX preserved; added VAT/shipping/setup budget, procurement checks, supplier order summary, approval workflow, CSV catalog import, and Blob image upload.
- 2026-06-18 16:55 (UTC+2): Added Vitest unit tests (17 passing) for calc/CSV, ESLint flat config (migrated off removed `next lint`), GitHub Actions CI, `.env.example`, error/loading/not-found UI, Vercel Analytics, and docs (`README`, `docs/SMOKE_TEST.md`, `docs/LAUNCH.md`, `docs/catalog-template.csv`). `npm run lint`, `npm test`, and `npm run build` all green.
- 2026-06-18 16:58 (UTC+2): Engineering for launch complete and verified. Owner-gated steps remain (provision Neon/Clerk/Blob, load real supplier data, invite users, run `prisma migrate deploy`, and `npx vercel --prod`). See `docs/LAUNCH.md`. Not auto-executed because they incur billing and modify live production.
- 2026-06-18 17:05 (UTC+2): Attempted automated provisioning (`vercel integration add neon|clerk`). BLOCKED: both require one-time marketplace terms acceptance in a browser before install can finish. Action required by owner:
  - Neon: https://vercel.com/yulzs-projects/~/integrations/accept-terms/neon?source=cli
  - Clerk: https://vercel.com/yulzs-projects/~/integrations/accept-terms/clerk?source=cli
  - Blob: create a store in the Vercel dashboard (Storage tab) or `vercel blob store add`.
  After accepting terms, re-run: `vercel integration add neon --no-claim -e production -e preview -e development` (and same for `clerk`), then `vercel env pull .env.local`, `npx prisma migrate deploy`, optional `npm run db:seed`, then `git push origin main && npx vercel --prod --yes`.
- 2026-06-18 17:15 (UTC+2): LAUNCHED. Owner accepted marketplace terms; provisioned Neon (`neon-byzantium-book`, Free), Clerk (`clerk-apricot-canvas`, Free), and public Blob store (`yacht-uniform-blob`). Added `directUrl`/`DATABASE_URL_UNPOOLED` to Prisma datasource; applied migration `0001_init` to Neon and seeded demo yacht (12 products, 4 looks, 6 crew). Set `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`SIGN_UP_URL` across all envs and fixed `proxy.js` to `redirectToSignIn()` for signed-out users (was rewriting to 404). Deployed production `dpl_4emb7jPt2s9rNVwBR8Xr1G129kWS` then `dpl_…3syju8iyi` → https://yachtuniform.vercel.app (Ready). Verified `/` 307-redirects to `/sign-in`; lint/tests/build all green.
