// Central runtime capability detection.
// The app runs in "local mode" (browser localStorage, single workspace) when the
// backend env vars are absent, and upgrades to a full multi-tenant SaaS the moment
// DATABASE_URL + Clerk keys are configured. This keeps dev/build always working.

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// The backend (server persistence + auth) is only "on" when both DB and auth exist.
export const backendEnabled = hasDatabase && hasClerk;

export const appConfig = {
  hasDatabase,
  hasClerk,
  hasBlob,
  backendEnabled,
};
