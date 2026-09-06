'use client';

import { useEffect } from 'react';

const CLEANUP_MARKER = 'yachtUniform.demoSeedCleanup.v1';

export default function ClearLegacyDemoState() {
  useEffect(() => {
    try {
      if (window.localStorage.getItem(CLEANUP_MARKER)) return;
      window.localStorage.removeItem('yachtUniform.workspace.v5');
      window.localStorage.removeItem('yachtUniform.orders.v1');
      window.localStorage.setItem(CLEANUP_MARKER, '1');
      window.location.reload();
    } catch {}
  }, []);

  return null;
}
