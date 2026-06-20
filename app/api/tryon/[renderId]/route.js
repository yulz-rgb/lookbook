import { getActiveContext } from '../../../../lib/auth.js';
import { backendEnabled } from '../../../../lib/config.js';
import {
  assertRenderOwnership,
  findRenderById,
} from '../../../../lib/tryOnRenderStore.js';

export const runtime = 'nodejs';

export async function GET(_req, { params }) {
  const renderId = params?.renderId;
  if (!renderId || typeof renderId !== 'string') {
    return Response.json({ error: 'Invalid render ID' }, { status: 400 });
  }

  let ctx = null;
  if (backendEnabled) {
    ctx = await getActiveContext();
    if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const render = await findRenderById(renderId);
  if (!render) {
    return Response.json({ error: 'Render not found' }, { status: 404 });
  }

  if (backendEnabled) {
    const allowed = assertRenderOwnership(render, {
      userId: ctx.user.id,
      yachtId: ctx.yachtId,
    });
    if (!allowed) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return Response.json({
    renderId: render.renderId,
    status: render.status,
    imageUrl: render.imageUrl,
    error: render.error,
    excludedNote: render.excludedNote,
    lookVersion: render.lookVersion,
  });
}
