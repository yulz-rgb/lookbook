'use client';

import { useEffect } from 'react';

const CHUNK_RELOAD_KEY = 'yachtUniform.chunkReload';

function isChunkLoadError(message = '') {
  const text = String(message);
  return (
    text.includes('Failed to load chunk')
    || text.includes('Loading chunk')
    || text.includes('ChunkLoadError')
    || text.includes('dynamically imported module')
  );
}

/** After a deploy, stale tabs may reference deleted Next.js chunks — reload once. */
export function ChunkLoadRecovery() {
  useEffect(() => {
    function maybeReload(reason) {
      if (!isChunkLoadError(reason?.message || reason)) return;
      try {
        if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      } catch {
        // sessionStorage unavailable — still try one reload
      }
      window.location.reload();
    }

    function onRejection(event) {
      maybeReload(event.reason);
    }

    function onError(event) {
      maybeReload(event.error || event.message);
    }

    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onError);
    return () => {
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onError);
    };
  }, []);

  return null;
}

export { isChunkLoadError };
