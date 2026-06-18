// Server-side auth + tenant resolution.
// All functions are no-ops that return null when the backend is not configured,
// so the app degrades gracefully to local mode.
import { cookies } from 'next/headers';
import { auth, currentUser } from '@clerk/nextjs/server';
import { backendEnabled } from './config';
import { getDb } from './db';

const ACTIVE_YACHT_COOKIE = 'activeYachtId';

function slugify(value) {
  return (
    String(value || 'yacht')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'yacht'
  );
}

// Upsert the Clerk user into our DB and guarantee they own at least one yacht.
export async function syncCurrentUser() {
  if (!backendEnabled) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const db = getDb();
  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    `${userId}@placeholder.local`;
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || null;

  const user = await db.user.upsert({
    where: { clerkId: userId },
    update: { email, name },
    create: { clerkId: userId, email, name },
    include: { memberships: { include: { yacht: true } } },
  });

  if (user.memberships.length === 0) {
    const baseName = name ? `${name}'s Yacht` : 'My Yacht';
    const yacht = await db.yacht.create({
      data: {
        name: baseName,
        slug: `${slugify(baseName)}-${user.id.slice(-5)}`,
        settings: { create: { vessel: baseName } },
      },
    });
    await db.membership.create({
      data: { userId: user.id, yachtId: yacht.id, role: 'OWNER' },
    });
    return db.user.findUnique({
      where: { id: user.id },
      include: { memberships: { include: { yacht: true } } },
    });
  }
  return user;
}

// Resolve the active yacht + the caller's role, or null.
export async function getActiveContext() {
  if (!backendEnabled) return null;
  const user = await syncCurrentUser();
  if (!user) return null;
  const memberships = user.memberships;
  if (memberships.length === 0) return null;

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_YACHT_COOKIE)?.value;
  const membership =
    memberships.find((m) => m.yachtId === preferred) || memberships[0];

  return {
    user,
    yacht: membership.yacht,
    yachtId: membership.yachtId,
    role: membership.role,
    memberships,
  };
}

// Throw if the caller is not a member of the requested yacht (tenant guard).
export async function assertMembership(yachtId) {
  const ctx = await getActiveContext();
  if (!ctx) throw new Error('Not authenticated');
  const member = ctx.memberships.find((m) => m.yachtId === yachtId);
  if (!member) throw new Error('Forbidden: not a member of this yacht');
  return { ...ctx, yachtId, role: member.role };
}

export const ACTIVE_YACHT_COOKIE_NAME = ACTIVE_YACHT_COOKIE;
