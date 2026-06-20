'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { RotateCw, Sun } from 'lucide-react';
import {
  PREVIEW_FILL_RATIO,
  cutoutSrc,
  figureDimensions,
  modelPhotoDimensions,
} from '../lib/previewAssets';
import { defaultProductColour } from '../lib/productColour';

const AI_DISCLAIMER =
  'AI visualisation — garment sizing and physical fit must be confirmed separately.';

function buildSelectionPayload(bodyType, view, selectedProducts) {
  const productIds = selectedProducts.map((p) => p.id);
  const colours = Object.fromEntries(
    selectedProducts.map((p) => [p.id, p.selectedColour || defaultProductColour(p)]),
  );
  return { bodyType, view, productIds, colours };
}

function selectionKey(payload) {
  return JSON.stringify(payload);
}

async function parseTryOnResponse(res) {
  if (res.type === 'opaqueredirect' || res.status === 307 || res.status === 308) {
    throw new Error('Try-on is blocked by sign-in. Refresh the page or open /demo to generate without signing in.');
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<!doctype')) {
      throw new Error('Try-on service returned an unexpected page instead of data. Refresh and try again.');
    }
    throw new Error('Try-on service returned an unexpected response. Please refresh and try again.');
  }
  return res.json();
}

async function postTryOn(payload) {
  return fetch('/api/tryon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'manual',
  });
}

async function getTryOnRender(renderId) {
  return fetch(`/api/tryon/${renderId}`, { redirect: 'manual' });
}

export function ModelPreview({ bodyType, selectedProducts = [] }) {
  const [view, setView] = useState('front');
  const [brightness, setBrightness] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const frameRef = useRef(null);

  const [lookVersion, setLookVersion] = useState(0);
  const selectionRef = useRef('');
  const requestRef = useRef(0);

  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [excludedNote, setExcludedNote] = useState(null);

  const [completedImage, setCompletedImage] = useState(null);
  const [completedSelectionKey, setCompletedSelectionKey] = useState(null);

  const currentPayload = useMemo(
    () => buildSelectionPayload(bodyType, view, selectedProducts),
    [bodyType, view, selectedProducts],
  );
  const currentSelectionKey = useMemo(
    () => selectionKey(currentPayload),
    [currentPayload],
  );

  const hasProducts = selectedProducts.length > 0;
  const isStale =
    Boolean(completedImage)
    && completedSelectionKey != null
    && completedSelectionKey !== currentSelectionKey;

  useEffect(() => {
    if (selectionRef.current && selectionRef.current !== currentSelectionKey) {
      setLookVersion((v) => v + 1);
      setError(null);
    }
    selectionRef.current = currentSelectionKey;
  }, [currentSelectionKey]);

  const showingGenerated = Boolean(completedImage) && !isStale;
  const showingPrevious = Boolean(completedImage) && isStale;
  const activeSize = showingGenerated || showingPrevious
    ? modelPhotoDimensions(bodyType, view)
    : figureDimensions(bodyType, view);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const updateFit = () => {
      const targetHeight = frame.clientHeight * PREVIEW_FILL_RATIO;
      setFitScale(targetHeight / activeSize.height);
    };

    updateFit();
    const observer = new ResizeObserver(updateFit);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [activeSize.height]);

  const pollRender = useCallback(async (renderId, expectedLookVersion, requestId) => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (requestRef.current !== requestId) return null;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const res = await getTryOnRender(renderId);
      if (!res.ok) continue;
      const data = await parseTryOnResponse(res);
      if (requestRef.current !== requestId) return null;
      if (data.status === 'completed' && data.imageUrl) {
        return { ...data, lookVersion: expectedLookVersion };
      }
      if (data.status === 'failed') {
        throw new Error(data.error || 'Generation failed');
      }
    }
    throw new Error('Generation timed out — try again');
  }, []);

  const runGeneration = useCallback(async (reroll = false) => {
    if (aiUnavailable || !hasProducts || generating) return;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const expectedLookVersion = lookVersion;

    setGenerating(true);
    setError(null);

    try {
      const res = await postTryOn({
        ...currentPayload,
        lookVersion: expectedLookVersion,
        reroll,
      });

      if (res.status === 501) {
        setAiUnavailable(true);
        setError('AI try-on is not configured (missing GEMINI_API_KEY).');
        return;
      }

      const data = await parseTryOnResponse(res);
      if (!res.ok) {
        throw new Error(data.error || 'AI try-on request failed');
      }

      let result = data;
      if (data.status === 'generating' && data.renderId) {
        result = await pollRender(data.renderId, expectedLookVersion, requestId);
        if (!result) return;
      }

      if (requestRef.current !== requestId) return;
      if (expectedLookVersion !== lookVersion) return;

      if (result?.imageUrl) {
        setCompletedImage(result.imageUrl);
        setCompletedSelectionKey(currentSelectionKey);
        setExcludedNote(result.excludedNote || null);
      }
    } catch (err) {
      if (requestRef.current === requestId) {
        setError(err.message || 'Generation failed');
      }
    } finally {
      if (requestRef.current === requestId) {
        setGenerating(false);
      }
    }
  }, [
    aiUnavailable,
    currentPayload,
    currentSelectionKey,
    generating,
    hasProducts,
    lookVersion,
    pollRender,
  ]);

  const modelSrc = cutoutSrc(bodyType, view);
  const displayImage = showingGenerated || showingPrevious ? completedImage : null;
  const statusMessage = (() => {
    if (generating) return 'Generating realistic look…';
    if (error) return error;
    if (showingPrevious) return null;
    if (showingGenerated) return null;
    if (hasProducts && !aiUnavailable) return 'Ready to generate realistic look';
    if (hasProducts && aiUnavailable) return 'AI try-on unavailable';
    return null;
  })();

  return (
    <div ref={frameRef} className="preview-frame">
      <div className="preview-toolbar" role="toolbar" aria-label="Model preview controls">
        <button
          type="button"
          className={`preview-tool ${view === 'back' ? 'active' : ''}`}
          onClick={() => setView((v) => (v === 'front' ? 'back' : 'front'))}
          title={view === 'front' ? 'Show back view' : 'Show front view'}
          aria-label={view === 'front' ? 'Show back view' : 'Show front view'}
        >
          <RotateCw size={14} aria-hidden />
        </button>
        <button
          type="button"
          className="preview-tool"
          onClick={() => setBrightness((b) => (b >= 1.2 ? 1 : b + 0.06))}
          title="Adjust brightness"
          aria-label="Adjust brightness"
        >
          <Sun size={14} aria-hidden />
        </button>
      </div>

      <div className="preview-generate-bar">
        {showingGenerated ? (
          <button
            type="button"
            className="preview-generate-btn"
            disabled={generating || aiUnavailable || !hasProducts}
            onClick={() => runGeneration(true)}
          >
            Generate again
          </button>
        ) : (
          <button
            type="button"
            className="preview-generate-btn preview-generate-btn-primary"
            disabled={generating || aiUnavailable || !hasProducts}
            onClick={() => runGeneration(false)}
          >
            Generate realistic look
          </button>
        )}
        {error && showingPrevious ? (
          <button
            type="button"
            className="preview-generate-btn preview-generate-btn-secondary"
            disabled={generating || aiUnavailable || !hasProducts}
            onClick={() => runGeneration(false)}
          >
            Retry
          </button>
        ) : null}
      </div>

      <div
        className="preview-viewport"
        style={{ filter: brightness !== 1 ? `brightness(${brightness})` : undefined }}
      >
        <div
          className={`preview-figure-stack${displayImage ? ' preview-ai-frame' : ''} view-${view}`}
          style={{
            width: activeSize.width,
            height: activeSize.height,
            transform: `scale(${fitScale})`,
          }}
        >
          {displayImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={displayImage} alt="" className="preview-ai-image" draggable={false} />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={modelSrc}
              alt=""
              className="preview-model-cutout"
              draggable={false}
            />
          )}

          {showingPrevious ? (
            <div className="preview-stale-badge">Previous generated look</div>
          ) : null}

          {statusMessage ? (
            <div className="preview-ai-status">{statusMessage}</div>
          ) : null}
        </div>
      </div>

      {(showingGenerated || showingPrevious) && displayImage ? (
        <p className="preview-ai-disclaimer">{AI_DISCLAIMER}</p>
      ) : null}

      {excludedNote && (showingGenerated || showingPrevious) ? (
        <p className="preview-ai-note">{excludedNote}</p>
      ) : null}
    </div>
  );
}
