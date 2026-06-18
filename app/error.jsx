'use client';

import { isChunkLoadError } from '../components/ChunkLoadRecovery';

export default function Error({ error, reset }) {
  const chunkError = isChunkLoadError(error?.message);

  function handleAction() {
    if (chunkError) {
      window.location.reload();
      return;
    }
    reset();
  }

  return (
    <div className="auth-screen">
      <div className="status-card">
        <h2>{chunkError ? 'Update available' : 'Something went wrong'}</h2>
        <p>
          {chunkError
            ? 'A new version was deployed while this tab was open. Reload to fetch the latest app.'
            : (error?.message || 'An unexpected error occurred.')}
        </p>
        <button type="button" className="btn primary" onClick={handleAction}>
          {chunkError ? 'Reload page' : 'Try again'}
        </button>
      </div>
    </div>
  );
}
