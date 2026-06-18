'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getActiveContext, assertMembership, ACTIVE_YACHT_COOKIE_NAME } from '../lib/auth';
import {
  persistWorkspace,
  createOrderSnapshot,
  advanceOrderStatus,
  logAudit,
} from '../lib/repository';
import { backendEnabled } from '../lib/config';

// Persist the entire operational workspace for the caller's active yacht.
export async function saveWorkspaceAction(snapshot) {
  if (!backendEnabled) return { ok: false, mode: 'local' };
  const ctx = await getActiveContext();
  if (!ctx) return { ok: false, mode: 'local' };
  try {
    await persistWorkspace(ctx.yachtId, snapshot);
    await logAudit(ctx.yachtId, ctx.user.id, 'SAVE', 'Workspace', ctx.yachtId, {
      products: snapshot.products?.length || 0,
      looks: snapshot.looks?.length || 0,
      crew: snapshot.crew?.length || 0,
    });
    return { ok: true, mode: 'server' };
  } catch (err) {
    return { ok: false, mode: 'server', error: String(err?.message || err) };
  }
}

export async function setActiveYachtAction(yachtId) {
  if (!backendEnabled) return { ok: false };
  await assertMembership(yachtId);
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_YACHT_COOKIE_NAME, yachtId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath('/');
  return { ok: true };
}

export async function createOrderAction({ name, totals, snapshot }) {
  if (!backendEnabled) return { ok: false, mode: 'local' };
  const ctx = await getActiveContext();
  if (!ctx) return { ok: false, mode: 'local' };
  const order = await createOrderSnapshot(ctx.yachtId, {
    name,
    totals,
    snapshot,
    userId: ctx.user.id,
  });
  revalidatePath('/');
  return { ok: true, orderId: order.id, status: order.status };
}

export async function advanceOrderAction({ orderId, notes }) {
  if (!backendEnabled) return { ok: false, mode: 'local' };
  const ctx = await getActiveContext();
  if (!ctx) return { ok: false, mode: 'local' };
  // Only captains/owners can advance approvals.
  if (!['OWNER', 'CAPTAIN', 'CHIEF_STEW'].includes(ctx.role)) {
    return { ok: false, error: 'Insufficient permissions' };
  }
  const order = await advanceOrderStatus(ctx.yachtId, orderId, { userId: ctx.user.id, notes });
  revalidatePath('/');
  return { ok: true, status: order.status };
}
