/** Persistent try-on render records — Prisma when available, memory fallback for local demo. */

import { getDb } from './db.js';
import { hasDatabase } from './config.js';

const memoryRenders = new Map();

function serializeRender(record) {
  if (!record) return null;
  return {
    renderId: record.id,
    cacheKey: record.cacheKey,
    status: record.status,
    imageUrl: record.blobUrl || undefined,
    error: record.errorCode || undefined,
    excludedNote: record.excludedNote || undefined,
    lookVersion: record.lookVersion,
    rerollSeed: record.rerollSeed,
    yachtId: record.yachtId || undefined,
    userId: record.userId || undefined,
    completedAt: record.completedAt || undefined,
  };
}

export async function findRenderByCacheKey(cacheKey) {
  if (hasDatabase) {
    const db = getDb();
    const row = await db.tryOnRender.findUnique({ where: { cacheKey } });
    return row ? serializeRender(row) : null;
  }
  const row = memoryRenders.get(cacheKey);
  return row ? serializeRender(row) : null;
}

export async function findRenderById(renderId) {
  if (hasDatabase) {
    const db = getDb();
    const row = await db.tryOnRender.findUnique({ where: { id: renderId } });
    return row ? serializeRender(row) : null;
  }
  for (const row of memoryRenders.values()) {
    if (row.id === renderId) return serializeRender(row);
  }
  return null;
}

export async function createRenderRecord(data) {
  const now = new Date();
  const record = {
    id: data.id || `render_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    cacheKey: data.cacheKey,
    yachtId: data.yachtId || null,
    userId: data.userId || null,
    modelId: data.modelId,
    bodyType: data.bodyType,
    view: data.view,
    productIds: data.productIds,
    colours: data.colours,
    geminiModel: data.geminiModel,
    promptVersion: data.promptVersion,
    rerollSeed: data.rerollSeed || 0,
    lookVersion: data.lookVersion || 0,
    blobUrl: null,
    status: 'generating',
    errorCode: null,
    excludedNote: data.excludedNote || null,
    createdAt: now,
    completedAt: null,
    updatedAt: now,
  };

  if (hasDatabase) {
    const db = getDb();
    const row = await db.tryOnRender.create({
      data: {
        id: record.id,
        cacheKey: record.cacheKey,
        yachtId: record.yachtId,
        userId: record.userId,
        modelId: record.modelId,
        bodyType: record.bodyType,
        view: record.view,
        productIds: record.productIds,
        colours: record.colours,
        geminiModel: record.geminiModel,
        promptVersion: record.promptVersion,
        rerollSeed: record.rerollSeed,
        lookVersion: record.lookVersion,
        excludedNote: record.excludedNote,
        status: 'generating',
      },
    });
    return serializeRender(row);
  }

  memoryRenders.set(record.cacheKey, record);
  return serializeRender(record);
}

export async function markRenderCompleted(renderId, { blobUrl, excludedNote }) {
  const now = new Date();
  if (hasDatabase) {
    const db = getDb();
    const row = await db.tryOnRender.update({
      where: { id: renderId },
      data: {
        status: 'completed',
        blobUrl,
        excludedNote,
        completedAt: now,
      },
    });
    return serializeRender(row);
  }

  for (const [key, record] of memoryRenders.entries()) {
    if (record.id === renderId) {
      const next = {
        ...record,
        status: 'completed',
        blobUrl,
        excludedNote,
        completedAt: now,
        updatedAt: now,
      };
      memoryRenders.set(key, next);
      return serializeRender(next);
    }
  }
  return null;
}

export async function markRenderFailed(renderId, errorCode) {
  const now = new Date();
  if (hasDatabase) {
    const db = getDb();
    const row = await db.tryOnRender.update({
      where: { id: renderId },
      data: {
        status: 'failed',
        errorCode: String(errorCode || 'generation_failed').slice(0, 500),
        completedAt: now,
      },
    });
    return serializeRender(row);
  }

  for (const [key, record] of memoryRenders.entries()) {
    if (record.id === renderId) {
      const next = {
        ...record,
        status: 'failed',
        errorCode: String(errorCode || 'generation_failed').slice(0, 500),
        completedAt: now,
        updatedAt: now,
      };
      memoryRenders.set(key, next);
      return serializeRender(next);
    }
  }
  return null;
}

export function assertRenderOwnership(render, { userId, yachtId }) {
  if (!render) return false;
  if (!render.yachtId && !render.userId) return true;
  if (render.yachtId && render.yachtId !== yachtId) return false;
  if (render.userId && render.userId !== userId) return false;
  return true;
}

export function clearMemoryRenderStore() {
  memoryRenders.clear();
}
