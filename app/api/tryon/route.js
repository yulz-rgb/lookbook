import { hasAITryOn, requestTryOnRender } from '../../../lib/aiTryOn.js';
import { getActiveContext } from '../../../lib/auth.js';
import { backendEnabled } from '../../../lib/config.js';
import { normalizeColours } from '../../../lib/tryOnProducts.js';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req) {
  try {
    if (!hasAITryOn()) {
      return Response.json(
        { error: 'AI try-on is not configured (missing GEMINI_API_KEY)' },
        { status: 501 },
      );
    }

    let ctx = null;
    if (backendEnabled) {
      ctx = await getActiveContext();
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const bodyType = body?.bodyType === 'man' ? 'man' : 'woman';
    const view = body?.view === 'back' ? 'back' : 'front';
    const productIds = Array.isArray(body?.productIds)
      ? body.productIds.filter((id) => typeof id === 'string' && id)
      : [];
    const colours = normalizeColours(body?.colours);
    const lookVersion = Number.isFinite(body?.lookVersion) ? Number(body.lookVersion) : 0;
    const reroll = Boolean(body?.reroll);

    if (!productIds.length) {
      return Response.json({ error: 'No products provided' }, { status: 400 });
    }

    const result = await requestTryOnRender({
      bodyType,
      view,
      productIds,
      colours,
      lookVersion,
      reroll,
      origin: req.nextUrl.origin,
      yachtId: ctx?.yachtId || null,
      userId: ctx?.user?.id || null,
    });

    return Response.json({
      renderId: result.renderId,
      status: result.status,
      imageUrl: result.imageUrl,
      excludedNote: result.excludedNote,
      lookVersion: result.lookVersion,
    });
  } catch (err) {
    return Response.json(
      { error: String(err?.message || err), status: 'failed' },
      { status: 502 },
    );
  }
}
